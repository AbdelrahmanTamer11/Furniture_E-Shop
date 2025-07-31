#!/usr/bin/env python3
"""
🚀 FurniVision Quick Server
Simple HTTP server for local development and testing
"""

import http.server
import socketserver
import os
import webbrowser
import threading
import time

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers for local development
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

def open_browser():
    """Open browser after server starts"""
    time.sleep(1)  # Give server time to start
    print("🌐 Opening browser...")
    try:
        webbrowser.open('http://localhost:8000/status.html')
    except:
        print("💡 Manual open: http://localhost:8000/status.html")

def main():
    PORT = 8000
    HOST = "127.0.0.1"  # Explicitly bind to IPv4 localhost
    
    # Change to the frontend directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    print("🚀 Starting FurniVision Development Server...")
    print(f"📂 Serving files from: {os.getcwd()}")
    print(f"🌐 Server running at: http://localhost:{PORT}/")
    print(f"🌐 Also available at: http://127.0.0.1:{PORT}/")
    print("📋 Available pages:")
    print("   • Status: http://localhost:8000/status.html")
    print("   • Main Site: http://localhost:8000/index.html")
    print("   • Diagnostics: http://localhost:8000/diagnostic.html")
    print("   • Simple Demo: http://localhost:8000/simple.html")
    print("🛑 Press Ctrl+C to stop the server")
    print("-" * 60)
    
    # Start browser in a separate thread
    browser_thread = threading.Thread(target=open_browser)
    browser_thread.daemon = True
    browser_thread.start()
    
    # Start server with explicit IPv4 binding
    with socketserver.TCPServer((HOST, PORT), CustomHTTPRequestHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Server stopped by user")

if __name__ == "__main__":
    main()
