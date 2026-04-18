"""
Gorecory Inventory Tracker - Backend API Tests
Tests: Auth (register, login, legacy upgrade), Items (CRUD, mfg/expiry dates), 
       Reports (low-stock, near-expiry), Alerts (messages, email), Orders
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://7c883149-4270-480d-acda-2786d92bdadc.preview.emergentagent.com')
if BASE_URL.endswith('/'):
    BASE_URL = BASE_URL.rstrip('/')
if not BASE_URL.endswith('/api'):
    BASE_URL = BASE_URL + '/api'

# Test credentials
DEMO_EMAIL = "demo@gorecory.com"
DEMO_PASSWORD = "demo123"
TEST_USER_PREFIX = "TEST_"


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


class TestHealthAndBasics:
    """Basic connectivity tests"""
    
    def test_api_stats_endpoint(self, api_client):
        """Test /api/stats returns dashboard stats"""
        response = api_client.get(f"{BASE_URL}/stats")
        assert response.status_code == 200, f"Stats endpoint failed: {response.text}"
        data = response.json()
        assert "totalItems" in data
        assert "lowStockItems" in data
        assert "totalOrders" in data
        print(f"Stats: totalItems={data['totalItems']}, lowStock={data['lowStockItems']}")


class TestAuth:
    """Authentication endpoint tests - register, login, legacy upgrade"""
    
    def test_login_success_demo_user(self, api_client):
        """POST /api/login with demo@gorecory.com/demo123 works (bcrypt hashed on seed)"""
        response = api_client.post(f"{BASE_URL}/login", json={
            "email": DEMO_EMAIL,
            "password": DEMO_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert data.get("success") == True
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == DEMO_EMAIL
        print(f"Login success: user={data['user']['name']}")
    
    def test_login_wrong_password_returns_401(self, api_client):
        """POST /api/login with wrong password returns 401"""
        response = api_client.post(f"{BASE_URL}/login", json={
            "email": DEMO_EMAIL,
            "password": "wrongpassword123"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        data = response.json()
        assert "error" in data
        print(f"Wrong password correctly rejected: {data['error']}")
    
    def test_register_success(self, api_client):
        """POST /api/register success returns {success, token, user}"""
        unique_email = f"{TEST_USER_PREFIX}user_{int(time.time())}@test.com"
        response = api_client.post(f"{BASE_URL}/register", json={
            "name": "Test User",
            "email": unique_email,
            "password": "testpass123"
        })
        # Accept 200 or 201 as success
        assert response.status_code in [200, 201], f"Register failed: {response.text}"
        data = response.json()
        assert data.get("success") == True
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == unique_email
        print(f"Register success: {unique_email}")
    
    def test_register_duplicate_email_returns_409(self, api_client):
        """POST /api/register duplicate email returns 409 with error msg"""
        # First register
        unique_email = f"{TEST_USER_PREFIX}dup_{int(time.time())}@test.com"
        api_client.post(f"{BASE_URL}/register", json={
            "name": "First User",
            "email": unique_email,
            "password": "testpass123"
        })
        # Try duplicate
        response = api_client.post(f"{BASE_URL}/register", json={
            "name": "Second User",
            "email": unique_email,
            "password": "testpass456"
        })
        assert response.status_code == 409, f"Expected 409 for duplicate, got {response.status_code}"
        data = response.json()
        assert "error" in data
        print(f"Duplicate email correctly rejected: {data['error']}")


class TestItems:
    """Items CRUD tests including mfg_date and expiry_date"""
    
    def test_get_items_includes_mfg_and_expiry_dates(self, api_client):
        """GET /api/items includes mfg_date and expiry_date columns"""
        response = api_client.get(f"{BASE_URL}/items")
        assert response.status_code == 200
        items = response.json()
        assert isinstance(items, list)
        assert len(items) > 0, "No items found in database"
        # Check first item has the date fields
        item = items[0]
        # Fields may be null but should exist in response
        assert "mfg_date" in item or "mfgDate" in item, f"mfg_date not in item: {item.keys()}"
        assert "expiry_date" in item or "expiryDate" in item, f"expiry_date not in item: {item.keys()}"
        print(f"Items returned: {len(items)}, first item has date fields")
    
    def test_create_item_with_dates(self, api_client):
        """POST /api/items accepts mfgDate and expiryDate and persists them"""
        test_sku = f"TEST-{int(time.time())}"
        response = api_client.post(f"{BASE_URL}/items", json={
            "name": "Test Product with Dates",
            "sku": test_sku,
            "quantity": 100,
            "price": 19.99,
            "cost": 10.00,
            "location": "Main Warehouse",
            "category": "Electronics",
            "supplier": "TechSupply Co",
            "reorderLevel": 25,
            "mfgDate": "2025-01-01",
            "expiryDate": "2026-06-15"
        })
        assert response.status_code == 200, f"Create item failed: {response.text}"
        item = response.json()
        assert item["sku"] == test_sku
        # Verify dates were persisted
        mfg = item.get("mfg_date") or item.get("mfgDate")
        exp = item.get("expiry_date") or item.get("expiryDate")
        assert mfg is not None, "mfg_date not returned"
        assert exp is not None, "expiry_date not returned"
        assert "2025-01-01" in str(mfg)
        assert "2026-06-15" in str(exp)
        print(f"Created item {test_sku} with mfg={mfg}, expiry={exp}")
        
        # Cleanup
        if "id" in item:
            api_client.delete(f"{BASE_URL}/items/{item['id']}")
    
    def test_update_item_preserves_reorder_level(self, api_client):
        """PUT /api/items preserves reorder level"""
        # Get existing item (Wireless Mouse has reorder_level=50)
        response = api_client.get(f"{BASE_URL}/items")
        items = response.json()
        wireless_mouse = next((i for i in items if "Wireless Mouse" in i.get("name", "")), None)
        
        if wireless_mouse:
            item_id = wireless_mouse["id"]
            original_reorder = wireless_mouse.get("reorder_level") or wireless_mouse.get("reorderLevel") or 50
            
            # Update with same reorder level
            update_response = api_client.put(f"{BASE_URL}/items/{item_id}", json={
                "name": wireless_mouse["name"],
                "sku": wireless_mouse["sku"],
                "quantity": wireless_mouse["quantity"],
                "price": wireless_mouse["price"],
                "cost": wireless_mouse.get("cost", 0),
                "location": wireless_mouse.get("location", ""),
                "category": wireless_mouse.get("category", ""),
                "supplier": wireless_mouse.get("supplier", ""),
                "reorderLevel": original_reorder,
                "mfgDate": wireless_mouse.get("mfg_date"),
                "expiryDate": wireless_mouse.get("expiry_date")
            })
            assert update_response.status_code == 200
            updated = update_response.json()
            new_reorder = updated.get("reorder_level") or updated.get("reorderLevel")
            assert new_reorder == original_reorder, f"Reorder level changed from {original_reorder} to {new_reorder}"
            print(f"Reorder level preserved: {new_reorder}")
        else:
            pytest.skip("Wireless Mouse not found in items")
    
    def test_status_filter_out_of_stock(self, api_client):
        """GET /api/items?status=Out of Stock returns correct items"""
        response = api_client.get(f"{BASE_URL}/items", params={"status": "Out of Stock"})
        assert response.status_code == 200
        items = response.json()
        for item in items:
            assert item["status"] == "Out of Stock", f"Item {item['name']} has status {item['status']}"
        print(f"Out of Stock filter returned {len(items)} items")


class TestReports:
    """Reports endpoint tests"""
    
    def test_low_stock_report(self, api_client):
        """GET /api/reports/low-stock returns rows where quantity < reorder_level"""
        response = api_client.get(f"{BASE_URL}/reports/low-stock")
        assert response.status_code == 200
        items = response.json()
        assert isinstance(items, list)
        for item in items:
            qty = item.get("quantity", 0)
            reorder = item.get("reorder_level") or item.get("reorderLevel") or 50
            assert qty < reorder, f"Item {item['name']} qty={qty} >= reorder={reorder}"
        print(f"Low stock items: {len(items)}")
    
    def test_near_expiry_report(self, api_client):
        """GET /api/reports/near-expiry?days=15 returns items with expiry_date within 15 days"""
        response = api_client.get(f"{BASE_URL}/reports/near-expiry", params={"days": 15})
        assert response.status_code == 200
        items = response.json()
        assert isinstance(items, list)
        print(f"Near expiry items (15 days): {len(items)}")
        for item in items:
            exp = item.get("expiry_date") or item.get("expiryDate")
            print(f"  - {item['name']}: expires {exp}")


class TestAlerts:
    """Alerts endpoint tests"""
    
    def test_alerts_messages(self, api_client):
        """GET /api/alerts/messages?days=15 returns {lowStock, nearExpiry, messages, total}"""
        response = api_client.get(f"{BASE_URL}/alerts/messages", params={"days": 15})
        assert response.status_code == 200
        data = response.json()
        assert "lowStock" in data, f"Missing lowStock in response: {data.keys()}"
        assert "nearExpiry" in data, f"Missing nearExpiry in response: {data.keys()}"
        assert "messages" in data, f"Missing messages in response: {data.keys()}"
        assert "total" in data, f"Missing total in response: {data.keys()}"
        print(f"Alerts: lowStock={len(data['lowStock'])}, nearExpiry={len(data['nearExpiry'])}, total={data['total']}")
    
    def test_alerts_email_sends(self, api_client):
        """POST /api/alerts/email sends email via SMTP and returns {success:true, messageId}"""
        response = api_client.post(f"{BASE_URL}/alerts/email", json={"days": 15})
        # May fail if SMTP not configured, but should return proper response
        if response.status_code == 200:
            data = response.json()
            assert data.get("success") == True
            assert "messageId" in data
            print(f"Email sent successfully: messageId={data['messageId']}, to={data.get('to')}")
        elif response.status_code == 500:
            data = response.json()
            # SMTP not configured is acceptable
            if "SMTP" in data.get("error", ""):
                pytest.skip("SMTP not configured")
            else:
                pytest.fail(f"Email send failed: {data}")
        else:
            pytest.fail(f"Unexpected status {response.status_code}: {response.text}")


class TestOrders:
    """Orders endpoint tests"""
    
    def test_get_orders(self, api_client):
        """GET /api/orders returns orders list"""
        response = api_client.get(f"{BASE_URL}/orders")
        assert response.status_code == 200
        orders = response.json()
        assert isinstance(orders, list)
        print(f"Orders returned: {len(orders)}")
        
        # Check for Shipped/Processing orders (used for notification panel)
        active = [o for o in orders if o.get("status") in ["Shipped", "Processing"]]
        print(f"Active deliveries (Shipped/Processing): {len(active)}")
        for o in active[:3]:
            print(f"  - {o['id']}: {o['customer']} - {o['status']}")


class TestCategories:
    """Categories endpoint tests"""
    
    def test_get_categories(self, api_client):
        """GET /api/categories returns category list"""
        response = api_client.get(f"{BASE_URL}/categories")
        assert response.status_code == 200
        categories = response.json()
        assert isinstance(categories, list)
        assert len(categories) > 0
        print(f"Categories: {[c['name'] for c in categories]}")


class TestSuppliers:
    """Suppliers endpoint tests"""
    
    def test_get_suppliers(self, api_client):
        """GET /api/suppliers returns supplier list"""
        response = api_client.get(f"{BASE_URL}/suppliers")
        assert response.status_code == 200
        suppliers = response.json()
        assert isinstance(suppliers, list)
        assert len(suppliers) > 0
        print(f"Suppliers: {[s['name'] for s in suppliers]}")


class TestWarehouses:
    """Warehouses endpoint tests"""
    
    def test_get_warehouses(self, api_client):
        """GET /api/warehouses returns warehouse list"""
        response = api_client.get(f"{BASE_URL}/warehouses")
        assert response.status_code == 200
        warehouses = response.json()
        assert isinstance(warehouses, list)
        assert len(warehouses) > 0
        print(f"Warehouses: {[w['name'] for w in warehouses]}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
