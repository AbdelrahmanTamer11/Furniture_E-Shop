#!/usr/bin/env python3
"""
🚀 FurniVision Simple HTTP Server
Alternative lightweight server for localhost testing
"""

import http.server
import socketserver
import os
import webbrowser
import threading
import time
import sys

def open_browser_delayed():
    """Open browser after server starts"""
    time.sleep(2)  # Give server time to start
    print("🌐 Opening browser...")
    try:
        webbrowser.open('http://127.0.0.1:8000/status.html')
    except:
        print("💡 Manual open: http://127.0.0.1:8000/status.html")

def main():
    PORT = 8000
    
    # Change to the frontend directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    print("🚀 FurniVision Simple Server Starting...")
    print(f"📂 Directory: {os.getcwd()}")
    print(f"🌐 URL: http://127.0.0.1:{PORT}/")
    print(f"🌐 Alternative: http://localhost:{PORT}/")
    print("📋 Quick Links:")
    print(f"   • Status: http://127.0.0.1:{PORT}/status.html")
    print(f"   • Main: http://127.0.0.1:{PORT}/index.html")
    print(f"   • Test: http://127.0.0.1:{PORT}/diagnostic.html")
    print("🛑 Press Ctrl+C to stop")
    print("-" * 50)
    
    # Start browser in background
    browser_thread = threading.Thread(target=open_browser_delayed)
    browser_thread.daemon = True
    browser_thread.start()
    
    # Use simple HTTP server
    handler = http.server.SimpleHTTPRequestHandler
    
    try:
        with socketserver.TCPServer(("127.0.0.1", PORT), handler) as httpd:
            print(f"✅ Server ready at http://127.0.0.1:{PORT}/")
            httpd.serve_forever()
    except OSError as e:
        if "Address already in use" in str(e):
            print(f"❌ Port {PORT} is already in use!")
            print("💡 Try these solutions:")
            print("   1. Close any browser tabs using localhost:8000")
            print("   2. Wait a few seconds and try again")
            print("   3. Use a different port")
            print("\n🔄 Trying port 8001...")
            try:
                with socketserver.TCPServer(("127.0.0.1", 8001), handler) as httpd:
                    print(f"✅ Server ready at http://127.0.0.1:8001/")
                    webbrowser.open('http://127.0.0.1:8001/status.html')
                    httpd.serve_forever()
            except Exception as e2:
                print(f"❌ Failed to start server: {e2}")
        else:
            print(f"❌ Server error: {e}")
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")

if __name__ == "__main__":
    main()
