import fs from 'fs';
import path from 'path';

const dir = 'public';
const files = fs.readdirSync(dir);

const replacements = {
  'user_dashboard.html': 'customer_dashboard.html',
  'user_form.html': 'customer_register.html',
  'userHeader.html': 'customerHeader.html',
  'admin_users.html': 'admin_customers.html',
  '/api/admin/users': '/api/admin/customers',
  'User Directory': 'Customer Directory'
};

files.forEach(file => {
  if (file.endsWith('.html')) {
    const fullPath = path.join(dir, file);
    let content = fs.readFileSync(fullPath, 'utf8');
    let modified = false;
    
    for (const [oldStr, newStr] of Object.entries(replacements)) {
      if (content.includes(oldStr)) {
        content = content.split(oldStr).join(newStr);
        modified = true;
      }
    }
    
    if (modified) {
      fs.writeFileSync(fullPath, content);
      console.log(`Updated HTML refs in ${file}`);
    }
  }
});
