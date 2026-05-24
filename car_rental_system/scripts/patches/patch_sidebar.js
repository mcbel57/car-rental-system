import fs from 'fs';
import path from 'path';

const dir = 'public';
const files = fs.readdirSync(dir);

const newNav = `
            <nav class="flex-1 px-4 space-y-1.5 mt-4">
                <a href="admin_dashboard.html"
                    class="flex items-center space-x-3 py-3.5 px-4 rounded-2xl text-slate-400 hover:bg-white/5 hover:text-white transition-all font-semibold">
                    <i class="fas fa-th-large text-lg"></i>
                    <span>Overview</span>
                </a>
                <div class="pt-6 pb-2 px-4 uppercase text-[10px] font-black tracking-widest text-slate-500">Management</div>
                <a href="admin_customers.html"
                    class="flex items-center space-x-3 py-3.5 px-4 rounded-2xl text-slate-400 hover:bg-white/5 hover:text-white transition-all font-semibold">
                    <i class="fas fa-users text-lg"></i>
                    <span>Customer Directory</span>
                </a>
                <a href="admin_drivers.html"
                    class="flex items-center space-x-3 py-3.5 px-4 rounded-2xl text-slate-400 hover:bg-white/5 hover:text-white transition-all font-semibold">
                    <i class="fas fa-user-tie text-lg"></i>
                    <span>Approved Drivers</span>
                </a>
                <a href="admin_driver_management.html"
                    class="flex items-center space-x-3 py-3.5 px-4 rounded-2xl text-slate-400 hover:bg-white/5 hover:text-white transition-all font-semibold">
                    <i class="fas fa-id-card text-lg"></i>
                    <span>Driver Vetting</span>
                </a>
                <a href="admin_cars.html"
                    class="flex items-center space-x-3 py-3.5 px-4 rounded-2xl text-slate-400 hover:bg-white/5 hover:text-white transition-all font-semibold">
                    <i class="fas fa-car-side text-lg"></i>
                    <span>Fleet Control</span>
                </a>
                <a href="admin_view_rentals.html"
                    class="flex items-center space-x-3 py-3.5 px-4 rounded-2xl text-slate-400 hover:bg-white/5 hover:text-white transition-all font-semibold">
                    <i class="fas fa-clock-rotate-left text-lg"></i>
                    <span>Rental History</span>
                </a>
            </nav>
`;

files.forEach(file => {
  if (file.startsWith('admin_') && file.endsWith('.html')) {
    const fullPath = path.join(dir, file);
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Replace the entire <nav>...</nav> block
    const navStart = content.indexOf('<nav');
    const navEnd = content.indexOf('</nav>') + 6;
    
    if (navStart !== -1 && navEnd !== -1) {
      const before = content.substring(0, navStart);
      const after = content.substring(navEnd);
      content = before + newNav + after;
      
      // Fix active states manually
      if (file === 'admin_dashboard.html') content = content.replace('href="admin_dashboard.html"\n                    class="flex items-center space-x-3 py-3.5 px-4 rounded-2xl text-slate-400 hover:bg-white/5 hover:text-white transition-all font-semibold"', 'href="admin_dashboard.html"\n                    class="flex items-center space-x-3 py-3.5 px-4 rounded-2xl bg-indigo-600/10 text-indigo-400 font-bold border border-indigo-500/20 transition-all font-semibold"');
      if (file === 'admin_customers.html') content = content.replace('href="admin_customers.html"\n                    class="flex items-center space-x-3 py-3.5 px-4 rounded-2xl text-slate-400 hover:bg-white/5 hover:text-white transition-all font-semibold"', 'href="admin_customers.html"\n                    class="flex items-center space-x-3 py-3.5 px-4 rounded-2xl bg-indigo-600/10 text-indigo-400 font-bold border border-indigo-500/20 transition-all font-semibold"');
      if (file === 'admin_drivers.html') content = content.replace('href="admin_drivers.html"\n                    class="flex items-center space-x-3 py-3.5 px-4 rounded-2xl text-slate-400 hover:bg-white/5 hover:text-white transition-all font-semibold"', 'href="admin_drivers.html"\n                    class="flex items-center space-x-3 py-3.5 px-4 rounded-2xl bg-indigo-600/10 text-indigo-400 font-bold border border-indigo-500/20 transition-all font-semibold"');
      if (file === 'admin_driver_management.html') content = content.replace('href="admin_driver_management.html"\n                    class="flex items-center space-x-3 py-3.5 px-4 rounded-2xl text-slate-400 hover:bg-white/5 hover:text-white transition-all font-semibold"', 'href="admin_driver_management.html"\n                    class="flex items-center space-x-3 py-3.5 px-4 rounded-2xl bg-indigo-600/10 text-indigo-400 font-bold border border-indigo-500/20 transition-all font-semibold"');
      if (file === 'admin_cars.html' || file === 'admin_manage_cars.html') content = content.replace('href="admin_cars.html"\n                    class="flex items-center space-x-3 py-3.5 px-4 rounded-2xl text-slate-400 hover:bg-white/5 hover:text-white transition-all font-semibold"', 'href="admin_cars.html"\n                    class="flex items-center space-x-3 py-3.5 px-4 rounded-2xl bg-indigo-600/10 text-indigo-400 font-bold border border-indigo-500/20 transition-all font-semibold"');
      if (file === 'admin_view_rentals.html') content = content.replace('href="admin_view_rentals.html"\n                    class="flex items-center space-x-3 py-3.5 px-4 rounded-2xl text-slate-400 hover:bg-white/5 hover:text-white transition-all font-semibold"', 'href="admin_view_rentals.html"\n                    class="flex items-center space-x-3 py-3.5 px-4 rounded-2xl bg-indigo-600/10 text-indigo-400 font-bold border border-indigo-500/20 transition-all font-semibold"');

      fs.writeFileSync(fullPath, content);
      console.log(`Patched sidebar in ${file}`);
    }
  }
});
