
const projects = [
  { created_at: "2026-03-08 03:48:05.075256+00", financials: { cost_items: [{ id: "1", amount: 573, detail: "14k" }] }, budget: "1650" },
  { created_at: "2026-01-27 15:53:58.874593+00", financials: { cost_items: [{ id: "2", amount: 686, detail: "Manufacturing" }] }, budget: "1750" }
];

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const currentYear = 2026;

const revenueMap = new Map();
months.forEach(m => revenueMap.set(m, 0));

projects.forEach(p => {
    const date = new Date(p.created_at);
    if (date.getFullYear() === currentYear) {
        const month = months[date.getMonth()];
        const amount = p.financials?.selling_price || p.budget || 0;
        console.log(`Month: ${month}, Amount: ${amount}, Type: ${typeof amount}`);
        revenueMap.set(month, (revenueMap.get(month) || 0) + amount);
    }
});

const result = months.map(name => ({
    name,
    total: revenueMap.get(name) || 0
}));

console.log(JSON.stringify(result, null, 2));
