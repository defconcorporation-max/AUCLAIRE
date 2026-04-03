import urllib.request
url = "https://raw.githubusercontent.com/defconcorporation-max/AUCLAIRE/d3fc63a11d381221988df7c3d27b394432374610/src/pages/projects/ProjectDetails.tsx"
try:
    content = urllib.request.urlopen(url).read().decode('utf-8')
    with open("ProjectDetails_old.tsx", "w", encoding="utf-8") as f:
        f.write(content)
    print("Download successful")
except Exception as e:
    print(f"Failed: {e}")
