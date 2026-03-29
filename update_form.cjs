const fs = require('fs');
let html = fs.readFileSync('form.html', 'utf8');

// Update Title
html = html.replace(/<title>.*?<\/title>/, '<title>Patrick Zepeda | Consultation Request</title>');

// Update OG Title
html = html.replace(/<meta property="og:title" content="[^"]*">/, '<meta property="og:title" content="Patrick Zepeda | Consultation Request">');

// Update OG Description
html = html.replace(/<meta property="og:description" content="[^"]*">/, '<meta property="og:description" content="Analog Instinct. Digital Precision. I deploy personalized systems — wired for conversion, built to scale.">');

// Update Itemprop Name
html = html.replace(/<meta itemprop="name" content="[^"]*">/, '<meta itemprop="name" content="Patrick Zepeda | Consultation Request">');

// Update Itemprop Description
html = html.replace(/<meta itemprop="description" content="[^"]*">/, '<meta itemprop="description" content="Analog Instinct. Digital Precision. I deploy personalized systems — wired for conversion, built to scale.">');

// Update OG Image
html = html.replace(/<meta property="og:image" content="[^"]*">/, '<meta property="og:image" content="https://patrickzepeda.com/og-image.svg">');

// Update Itemprop Image
html = html.replace(/<meta itemprop="image" content="[^"]*">/, '<meta itemprop="image" content="https://patrickzepeda.com/og-image.svg">');
html = html.replace(/<meta itemprop="imageUrl" content="[^"]*">/, '<meta itemprop="imageUrl" content="https://patrickzepeda.com/og-image.svg">');
html = html.replace(/<meta itemprop="thumbnailUrl" content="[^"]*">/, '<meta itemprop="thumbnailUrl" content="https://patrickzepeda.com/og-image.svg">');

// Update Favicon
html = html.replace(/<link rel="shortcut icon" sizes="16x16" href="[^"]*">/, '<link rel="shortcut icon" sizes="16x16" href="/favicon.svg">');

fs.writeFileSync('form.html', html);
console.log('Updated form.html metadata');
