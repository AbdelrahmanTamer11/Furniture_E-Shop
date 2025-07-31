"""
Test Server for FurniVision
"""
import http.server
import socketserver
import os

PORT = 8000

os.chdir(os.path.dirname(os.path.abspath(__file__)))

print(f"Starting test server on port {PORT}")
print(f"Directory: {os.getcwd()}")
print(f"Files: {os.listdir('.')}")

Handler = http.server.SimpleHTTPRequestHandler

try:
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Server running at http://localhost:{PORT}")
        print("Press Ctrl+C to stop")
        httpd.serve_forever()
except Exception as e:
    print(f"Error: {e}")
    input("Press Enter to exit...")
