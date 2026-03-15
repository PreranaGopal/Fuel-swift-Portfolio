import os
import smtplib
from email.message import EmailMessage
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# In-memory storage for demo
SLOT_BOOKINGS = []
DELIVERY_ORDERS = []

# Example station emails (in real app, store in DB)
STATIONS = {
    1: {"name": "Nearest Bunk A", "email": os.environ.get("BUNK_A_EMAIL", "preranaprerana57@gmail.com")},
    2: {"name": "Nearest Bunk B", "email": os.environ.get("BUNK_B_EMAIL", "preranaprerana57@gmail.com")}
}

# SMTP config via environment variables
SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_USER = "preranagopal35@gmail.com"   # must match the Gmail used for App Password
SMTP_PASS = "relljdbozdsojpzp"           # App Password, no spaces
FROM_EMAIL = SMTP_USER

def send_email(to_email: str, subject: str, body: str):
    """Send a simple email using smtplib. Returns True on success."""
    try:
        msg = EmailMessage()
        msg["From"] = FROM_EMAIL
        msg["To"] = "preranaprerana57@gmail.com"  # 👈 receiver email must be a string
        msg["Subject"] = subject
        msg.set_content(body)

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as smtp:
            smtp.starttls()
            smtp.login(SMTP_USER, SMTP_PASS)
            smtp.send_message(msg)
        print(f"Email sent successfully to {"preranaprerana57@gmail.com"}")
        return True
    except Exception as e:
        print("email send failed:", e)
        return False

@app.route("/api/book_slot", methods=["POST"])
def api_book_slot():
    data = request.get_json() or {}
    station_id = data.get("station_id")
    station_name = data.get("station_name")
    fuel_type = data.get("fuel_type")  # changed
    time = data.get("time")
    user_email = data.get("user_email", "user@example.com")

    if not station_id or not fuel_type or not time:
        return jsonify({"error": "Missing fields"}), 400

    booking = {
    "id": len(SLOT_BOOKINGS) + 1,
    "station_id": station_id,
    "station_name": station_name,
    "fuel_type": fuel_type,   # changed
    "time": time,
    "user_email": user_email
}
    
    SLOT_BOOKINGS.append(booking)

    print("New booking:",booking)
# Send notification email to station
    station = STATIONS.get(station_id, {"email": "bunk@example.com"})
    subject_station = f"New Slot Booking - {fuel_type}"
    body_station = (
        f"A new slot has been booked:\n\n"
        f"Fuel: {fuel_type}\nTime: {time}\nUser: {user_email}\nStation: {station_name}"
    )
    send_email(station["email"], subject_station, body_station)

    # ✅ Single return at the end
    return jsonify({
        "ok": True,
        "booking": booking,
        "station_name": station_name
    }), 200

@app.route("/api/order_delivery", methods=["POST"])
def api_order_delivery():
    data = request.get_json() or {}
    fuel_main = data.get("fuel_main")
    fuel_type = data.get("fuel_type") or fuel_main
    payment = data.get("payment")
    used_gps = data.get("usedGPS", False)
    location = data.get("location")
    user_email = data.get("user_email", "user@example.com")

    if not fuel_main or not payment or not location:
        return jsonify({"error": "Missing fields"}), 400

    order = {
        "id": len(DELIVERY_ORDERS) + 1,
        "fuel_main": fuel_main,
        "fuel_type": fuel_type,
        "payment": payment,
        "used_gps": used_gps,
        "location": location,
        "user_email": user_email
    }
    DELIVERY_ORDERS.append(order)

    print("new delivery order:",order)

    # Send email to a default bunk email (demo)
    subject = f"New Fuel Delivery Order - {fuel_type}"
    body = f"Order details:\nFuel: {fuel_type}\nPayment: {payment}\nLocation: {location}\nUser: {user_email}"
    # send to both bunk A and B for demo
    send_email(STATIONS[1]["email"], subject, body)
    send_email(STATIONS[2]["email"], subject, body)

    return jsonify({"ok": True, "order": order}), 200

@app.route("/health")
def health():
    return jsonify({"status": "ok"})

if __name__ == "__main__":
    # Run with: python app.py
    app.run(host="0.0.0.0", port=5000, debug=True)
