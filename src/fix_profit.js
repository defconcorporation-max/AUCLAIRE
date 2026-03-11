const fs = require('fs');
const path = require('path');

const filePath = path.join('d:', 'auclaire app', 'src', 'pages', 'projects', 'ProjectDetails.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Line 1029: Additional Expense block
const oldLine1 = `                                    {project.financials?.additional_expense ? (
                                        <>
                                            <div>Additional Expense:</div>
                                            <div className="font-mono text-right text-red-500">-$\\{project.financials.additional_expense}</div>
                                        </>
                                    ) : null}`;
const newLine1 = `                                    {project.financials?.additional_expense && project.financials.additional_expense > 0 ? (
                                        <>
                                            <div>Additional Expense:</div>
                                            <div className="font-mono text-right text-red-500">-$\\{project.financials.additional_expense}</div>
                                        </>
                                    ) : null}

                                    {project.financials?.cost_items?.map((item, idx) => (
                                        <React.Fragment key={item.id || idx}>
                                            <div>\\{item.detail || "Cost Item"}:</div>
                                            <div className="font-mono text-right text-red-500">-$\\{item.amount}</div>
                                        </React.Fragment>
                                    ))}`;
content = content.replace(oldLine1, newLine1);


// 2. Line 1051: Net profit Logic color wrapper
const oldLine2 = `                                    <div className={\`border-t pt-1 font-mono text-right font-bold \\{\\(() => \\{
                                        const salePrice = Number(project.financials?.selling_price || project.budget || 0);
                                        const comm = project.affiliate_id ? (project.affiliate_commission_type === 'fixed' ? Number(project.affiliate_commission_rate || 0) : (salePrice * (Number(project.affiliate_commission_rate) || 0) / 100)) : 0;
                                        return salePrice - (project.financials?.supplier_cost || 0) - (project.financials?.shipping_cost || 0) - (project.financials?.customs_fee || 0) - (project.financials?.additional_expense || 0) - comm > 0 ? 'text-green-600' : 'text-red-600';
                                    })()\\}\`}>`;

const newLine2 = `                                    <div className={\`border-t pt-1 font-mono text-right font-bold \\{\\(() => \\{
                                        const salePrice = Number(project.financials?.selling_price || project.budget || 0);
                                        const comm = project.affiliate_id ? (project.affiliate_commission_type === 'fixed' ? Number(project.affiliate_commission_rate || 0) : (salePrice * (Number(project.affiliate_commission_rate) || 0) / 100)) : 0;
                                        const dynamicCosts = project.financials?.cost_items?.reduce((sum, item) => sum + (Number(item.amount) || 0), 0) || 0;
                                        return salePrice - (project.financials?.supplier_cost || 0) - (project.financials?.shipping_cost || 0) - (project.financials?.customs_fee || 0) - (project.financials?.additional_expense || 0) - dynamicCosts - comm > 0 ? 'text-green-600' : 'text-red-600';
                                    })()\\}\`}>`;
content = content.replace(oldLine2, newLine2);


// 3. Line 1056: The actual evaluated text rendering the value
const oldLine3 = `                                        $\\{\\(() => \\{
                                            const salePrice = Number(project.financials?.selling_price || project.budget || 0);
                                            const comm = project.affiliate_id ? (project.affiliate_commission_type === 'fixed' ? Number(project.affiliate_commission_rate || 0) : (salePrice * (Number(project.affiliate_commission_rate) || 0) / 100)) : 0;
                                            return (salePrice -
                                                (project.financials?.supplier_cost || 0) -
                                                (project.financials?.shipping_cost || 0) -
                                                (project.financials?.customs_fee || 0) -
                                                (project.financials?.additional_expense || 0) -
                                                comm
                                            ).toLocaleString(undefined, \\{ minimumFractionDigits: 2, maximumFractionDigits: 2 \\});
                                        })()\\}`;
const newLine3 = `                                        $\\{\\(() => \\{
                                            const salePrice = Number(project.financials?.selling_price || project.budget || 0);
                                            const comm = project.affiliate_id ? (project.affiliate_commission_type === 'fixed' ? Number(project.affiliate_commission_rate || 0) : (salePrice * (Number(project.affiliate_commission_rate) || 0) / 100)) : 0;
                                            const dynamicCosts = project.financials?.cost_items?.reduce((sum, item) => sum + (Number(item.amount) || 0), 0) || 0;
                                            return (salePrice -
                                                (project.financials?.supplier_cost || 0) -
                                                (project.financials?.shipping_cost || 0) -
                                                (project.financials?.customs_fee || 0) -
                                                (project.financials?.additional_expense || 0) -
                                                dynamicCosts -
                                                comm
                                            ).toLocaleString(undefined, \\{ minimumFractionDigits: 2, maximumFractionDigits: 2 \\});
                                        })()\\}`;
content = content.replace(oldLine3, newLine3);


// 4. Line 1078: The Export to Expenses alert condition
const oldLine4 = `                                                const totalCost = (project.financials?.supplier_cost || 0) +
                                                    (project.financials?.shipping_cost || 0) +
                                                    (project.financials?.customs_fee || 0);

                                                if (totalCost <= 0) \\{
                                                    alert("No costs to export (Supplier + Shipping + Customs = 0)");
                                                    return;
                                                \\}`;
const newLine4 = `                                                const dynamicCosts = project.financials?.cost_items?.reduce((sum, item) => sum + (Number(item.amount) || 0), 0) || 0;
                                                const totalCost = (project.financials?.supplier_cost || 0) +
                                                    (project.financials?.shipping_cost || 0) +
                                                    (project.financials?.customs_fee || 0) +
                                                    dynamicCosts;

                                                if (totalCost <= 0) \\{
                                                    alert("No costs to export (Supplier + Shipping + Customs + Items = 0)");
                                                    return;
                                                \\}`;
content = content.replace(oldLine4, newLine4);

fs.writeFileSync(filePath, content, 'utf-8');
console.log("Replaced successfully!");
