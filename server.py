import http.server
import socketserver
import os
import webbrowser
from pathlib import Path

# Configuration
PORT = 8000
DIRECTORY = "frontend"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def start_server():
    print("🚀 Starting FurniVision Server...")
    print(f"📁 Serving directory: {DIRECTORY}")
    print(f"🌐 Server running at: http://localhost:{PORT}")
    print(f"🔗 Main site: http://localhost:{PORT}/")
    print(f"🧪 Simple test: http://localhost:{PORT}/simple.html")
    print("\n✨ Server is ready! Press Ctrl+C to stop.\n")
    
    # Check if frontend directory exists
    if not os.path.exists(DIRECTORY):
        print(f"❌ Error: {DIRECTORY} directory not found!")
        return
    
    # Start server
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        try:
            # Open browser automatically
            webbrowser.open(f'http://localhost:{PORT}/simple.html')
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Server stopped by user")
        except Exception as e:
            print(f"❌ Server error: {e}")

if __name__ == "__main__":
    start_server()
