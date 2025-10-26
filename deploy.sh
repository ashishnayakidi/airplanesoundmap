#!/bin/bash

# AirplaneSoundMap Deployment Script
echo "🚀 AirplaneSoundMap Deployment Script"
echo "====================================="

# Check if we're in the right directory
if [ ! -f "index.html" ]; then
    echo "❌ Error: index.html not found. Please run this script from the project directory."
    exit 1
fi

echo "📁 Project files found:"
ls -la *.html *.css *.js *.json 2>/dev/null

echo ""
echo "🌐 Choose your deployment method:"
echo "1) Netlify (Recommended - Free)"
echo "2) Vercel (Free)"
echo "3) GitHub Pages (Free)"
echo "4) Firebase Hosting (Free)"
echo "5) Manual Upload"
echo ""

read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo "🚀 Deploying to Netlify..."
        echo "1. Go to https://netlify.com"
        echo "2. Sign up/login with GitHub"
        echo "3. Drag and drop this folder to deploy"
        echo "4. Get your live URL instantly!"
        echo ""
        echo "Or use Netlify CLI:"
        echo "npm install -g netlify-cli"
        echo "netlify deploy --prod --dir ."
        ;;
    2)
        echo "🚀 Deploying to Vercel..."
        echo "1. Go to https://vercel.com"
        echo "2. Sign up/login with GitHub"
        echo "3. Import your repository"
        echo "4. Deploy automatically!"
        echo ""
        echo "Or use Vercel CLI:"
        echo "npm install -g vercel"
        echo "vercel --prod"
        ;;
    3)
        echo "🚀 Deploying to GitHub Pages..."
        echo "1. Create a GitHub repository"
        echo "2. Upload all files to the repository"
        echo "3. Go to Settings > Pages"
        echo "4. Select source branch (usually 'main')"
        echo "5. Your site will be available at: https://username.github.io/repository-name"
        ;;
    4)
        echo "🚀 Deploying to Firebase..."
        echo "1. Install Firebase CLI: npm install -g firebase-tools"
        echo "2. Run: firebase login"
        echo "3. Run: firebase init hosting"
        echo "4. Run: firebase deploy"
        ;;
    5)
        echo "📤 Manual Upload Instructions:"
        echo "1. Zip all project files"
        echo "2. Upload to any web hosting service"
        echo "3. Extract files to public_html or www folder"
        echo "4. Access via your domain"
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again."
        exit 1
        ;;
esac

echo ""
echo "✅ Deployment instructions provided!"
echo ""
echo "📋 Next Steps:"
echo "1. Follow the deployment steps above"
echo "2. Test your live website"
echo "3. Share the URL with others"
echo "4. Set up a custom domain (optional)"
echo ""
echo "🔗 Useful Links:"
echo "- Netlify: https://netlify.com"
echo "- Vercel: https://vercel.com"
echo "- GitHub Pages: https://pages.github.com"
echo "- Firebase: https://firebase.google.com"
echo ""
echo "📖 For detailed instructions, see DEPLOYMENT.md"
