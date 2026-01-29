const fs = require('fs');
const path = require('path');
const regex = /[\u{1F300}-\u{1FAD6}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu;
const dirs = ['pages', 'js', 'css'];
const walk = (dir) => {
    fs.readdirSync(dir).forEach(file => {
        let fullPath = path.join(dir, file);
        if (fullPath.includes('codemirror')) return;
        if (fs.statSync(fullPath).isDirectory()) { walk(fullPath); }
        else if (/\.(js|css|html)$/.test(file)) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let lines = content.split('\n');
            lines.forEach((line, i) => {
                if ((line.includes('//') || line.includes('/*') || line.includes('<!--')) && regex.test(line)) {
                    console.log(`${fullPath}:${i+1} : ${line.trim()}`);
                }
            });
        }
    });
};
dirs.forEach(walk);
