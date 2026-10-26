import sys
import os

path = r'C:\Users\AURUMPC\.gemini\antigravity\scratch\radar-ride\client\src\App.jsx'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add import
if 'MyProfilePage' not in content:
    content = content.replace("import UserProfilePage from './pages/UserProfilePage';", "import UserProfilePage from './pages/UserProfilePage';\nimport MyProfilePage from './pages/MyProfilePage';")

# 2. Add route
if 'path="/my-profile"' not in content:
    content = content.replace('path="/profile/:id" element={<UserProfilePage />} />', 'path="/profile/:id" element={<UserProfilePage />} />\n                            <Route path="/my-profile" element={<MyProfilePage />} />')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("App.jsx updated with /my-profile route")
