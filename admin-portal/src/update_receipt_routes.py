import sys
import os

path = r'C:\Users\AURUMPC\.gemini\antigravity\scratch\radar-ride\client\src\App.jsx'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add import
if 'EphemeralReceiptsPage' not in content:
    content = content.replace("import MyProfilePage from './pages/MyProfilePage';", "import MyProfilePage from './pages/MyProfilePage';\nimport EphemeralReceiptsPage from './pages/EphemeralReceiptsPage';")

# 2. Add route
if 'path="/receipts/daily"' not in content:
    content = content.replace('path="/my-profile" element={<MyProfilePage />} />', 'path="/my-profile" element={<MyProfilePage />} />\n                            <Route path="/receipts/daily" element={<EphemeralReceiptsPage />} />')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("App.jsx updated with /receipts/daily route")
