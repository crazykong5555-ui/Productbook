import json
import unittest
from app import create_app
from app.extensions import db


class BackendApiTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.app.config["TESTING"] = True
        self.client = self.app.test_client()

    def test_complete_flow(self):
        # 1. Register
        test_email = "testuser_automated@example.com"
        reg_payload = {
            "nombre": "Test User",
            "email": test_email,
            "password": "Password123*"
        }
        res = self.client.post("/api/auth/register", json=reg_payload)
        self.assertIn(res.status_code, [201, 400])

        # 2. Login
        login_res = self.client.post("/api/auth/login", json={
            "email": test_email,
            "password": "Password123*"
        })
        self.assertEqual(login_res.status_code, 200)
        token = login_res.get_json().get("token")
        self.assertTrue(token)
        headers = {"Authorization": f"Bearer {token}"}

        # 3. ProductBook URLs / Products & Stock
        # List products
        urls_res = self.client.get("/api/urls/", headers=headers)
        self.assertEqual(urls_res.status_code, 200)

        # Create product with stock
        prod_res = self.client.post("/api/urls/", headers=headers, json={
            "producto": "Laptop Gamer",
            "imagen": "https://example.com/laptop.jpg",
            "descripcion": "Laptop de alto rendimiento",
            "valor": 1200.50,
            "cantidad": 5,
            "url": "https://store.example.com/laptop"
        })
        self.assertEqual(prod_res.status_code, 201)
        product_data = prod_res.get_json()
        prod_id = product_data["id"]
        self.assertEqual(product_data["producto"], "Laptop Gamer")
        self.assertEqual(product_data["cantidad"], 5)

        # Test partial stock update via PATCH /api/urls/<id>/stock
        stock_res = self.client.patch(f"/api/urls/{prod_id}/stock", headers=headers, json={
            "cantidad": 20
        })
        self.assertEqual(stock_res.status_code, 200)
        self.assertEqual(stock_res.get_json()["product"]["cantidad"], 20)

        # Test incremental adjustment (+10)
        adj_res = self.client.patch(f"/api/urls/{prod_id}/stock", headers=headers, json={
            "ajuste": 10
        })
        self.assertEqual(adj_res.status_code, 200)
        self.assertEqual(adj_res.get_json()["product"]["cantidad"], 30)

        # Test batch stock update
        batch_res = self.client.post("/api/urls/batch-stock", headers=headers, json=[
            {"id": prod_id, "cantidad": 45}
        ])
        self.assertEqual(batch_res.status_code, 200)

        # Update product
        update_res = self.client.put(f"/api/urls/{prod_id}", headers=headers, json={
            "producto": "Laptop Gamer Pro",
            "valor": 1300.00
        })
        self.assertEqual(update_res.status_code, 200)
        self.assertEqual(update_res.get_json()["producto"], "Laptop Gamer Pro")

        # Delete product
        del_prod = self.client.delete(f"/api/urls/{prod_id}", headers=headers)
        self.assertEqual(del_prod.status_code, 200)

        # 4. Agenda / Contacts
        agenda_res = self.client.get("/api/agenda/", headers=headers)
        self.assertEqual(agenda_res.status_code, 200)

        # Create contact
        contact_res = self.client.post("/api/agenda/", headers=headers, json={
            "nombre": "Juan Pérez",
            "telefono": "+123456789",
            "email": "juan@example.com"
        })
        self.assertEqual(contact_res.status_code, 201)
        contact_id = contact_res.get_json()["id"]

        # Update contact
        update_c = self.client.put(f"/api/agenda/{contact_id}", headers=headers, json={
            "nombre": "Juan Pérez Editado",
            "telefono": "+987654321"
        })
        self.assertEqual(update_c.status_code, 200)

        # Delete contact
        del_c = self.client.delete(f"/api/agenda/{contact_id}", headers=headers)
        self.assertEqual(del_c.status_code, 200)

        # 5. ProductBooks endpoint
        pb_res = self.client.get("/api/productbooks/", headers=headers)
        self.assertEqual(pb_res.status_code, 200)

        print("\nAll API flow and stock management tests passed successfully!\n")


if __name__ == "__main__":
    unittest.main()
