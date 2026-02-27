"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Gender, Participant, getAgeGroup } from "@/lib/avrudu";
import Link from "next/link";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { domToPng } from "modern-screenshot";

export default function ReportPage() {
    const [rows, setRows] = useState<Participant[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from LocalStorage
    useEffect(() => {
        const saved = localStorage.getItem("avrudu_participants");
        if (saved) {
            try {
                setRows(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to load data", e);
            }
        }
        setIsLoaded(true);
    }, []);

    // Save to LocalStorage (for things like setting places)
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem("avrudu_participants", JSON.stringify(rows));
        }
    }, [rows, isLoaded]);

    // Sport-wise report: { sport -> participants[] }
    const report = useMemo(() => {
        const map = new Map<string, Participant[]>();
        for (const r of rows) {
            if (!map.has(r.sport)) map.set(r.sport, []);
            map.get(r.sport)!.push(r);
        }
        return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    }, [rows]);

    function removeRow(id: string) {
        if (confirm("ඔබට මෙම වාර්තාව මැකීමට අවශ්‍යද?")) {
            setRows((prev) => prev.filter((x) => x.id !== id));
        }
    }

    function setPlace(id: string, place: string) {
        setRows((prev: Participant[]) =>
            prev.map((r: Participant) => (r.id === id ? { ...r, place: place || undefined } : r))
        );
    }

    function generateCSV(data: Participant[]) {
        const headers = ["Name", "Address", "DOB", "Phone", "NIC", "Division", "District", "Age", "Age Group", "Gender", "Sport", "Place", "Time"];
        const csvRows = data.map((r: Participant) => [
            r.name,
            r.address,
            r.dob,
            r.phone,
            r.nic,
            r.division,
            r.district,
            r.age,
            getAgeGroup(r.age),
            r.gender,
            r.sport,
            r.place || "-",
            new Date(r.createdAt).toLocaleString(),
        ]);

        return headers.join(",") + "\n" + csvRows.map((r: any[]) => r.join(",")).join("\n");
    }

    function downloadFile(content: string, fileName: string) {
        const blob = new Blob(["\ufeff", content], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", fileName);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function exportToCSV() {
        if (rows.length === 0) return;
        const csvContent = generateCSV(rows);
        downloadFile(csvContent, `avrudu_full_report_${new Date().getTime()}.csv`);
    }

    function exportToPDF() {
        if (rows.length === 0) return;
        const doc = new jsPDF();

        doc.setFontSize(20);
        doc.text("Avrudu 2026   - Full Sports Report", 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
        doc.text(`Total Participants: ${rows.length}`, 14, 36);

        const tableData = rows.map(r => [
            r.name,
            r.address,
            r.phone,
            r.nic,
            r.age,
            r.gender,
            r.sport,
            r.place || "-"
        ]);

        autoTable(doc, {
            head: [['Name', 'Address', 'Phone', 'NIC', 'Age', 'Gender', 'Sport', 'Place']],
            body: tableData,
            startY: 45,
            theme: 'striped',
            headStyles: { fillColor: [5, 150, 105] }
        });

        doc.save(`avrudu_full_report_${new Date().getTime()}.pdf`);
    }

    function exportSportToCSV(sportName: string, sportParticipants: Participant[]) {
        if (sportParticipants.length === 0) return;
        const csvContent = generateCSV(sportParticipants);
        const safeSportName = sportName.replace(/[^\w\s-]/g, '').trim() || "sport";
        downloadFile(csvContent, `report_${safeSportName}_${new Date().getTime()}.csv`);
    }

    async function exportToPDFDirect(elementId?: string, fileName?: string) {
        const element = elementId ? document.getElementById(elementId) : document.getElementById('full-report-content');
        if (!element) return;

        // Temporarily hide actions for cleaner PDF
        const actions = element.querySelectorAll('.no-export');
        actions.forEach((a: any) => a.style.display = 'none');

        try {
            const dataUrl = await domToPng(element, {
                scale: 2,
                backgroundColor: "#ffffff",
            });

            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = pageWidth - 20;

            // Temporary image to get dimensions
            const img = new Image();
            img.src = dataUrl;
            await new Promise((resolve) => img.onload = resolve);
            const imgHeight = (img.height * imgWidth) / img.width;

            let heightLeft = imgHeight;
            let position = 10;

            pdf.addImage(dataUrl, 'PNG', 10, position, imgWidth, imgHeight);
            heightLeft -= (pageHeight - 20);

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(dataUrl, 'PNG', 10, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            pdf.save(fileName || `avrudu_report_${new Date().getTime()}.pdf`);
        } catch (e) {
            console.error("PDF Export failed", e);
            alert("PDF එක සෑදීමේදී දෝෂයක් ඇති විය. කරුණාකර නැවත උත්සාහ කරන්න.");
        } finally {
            actions.forEach((a: any) => a.style.display = '');
        }
    }

    function handlePrint(sportName?: string) {
        if (sportName) {
            // Logic to print only one sport if needed, 
            // but window.print() is global. 
            // We can add a class to the body to filter in CSS.
            document.body.classList.add('printing-specific');
            const sections = document.querySelectorAll('.sport-section');
            sections.forEach(s => {
                if (s.getAttribute('data-sport') === sportName) {
                    s.classList.add('print-me');
                } else {
                    s.classList.add('no-print');
                }
            });
            window.print();
            // Cleanup
            document.body.classList.remove('printing-specific');
            sections.forEach(s => {
                s.classList.remove('print-me', 'no-print');
            });
        } else {
            window.print();
        }
    }

    return (
        <div className="min-h-screen p-4 sm:p-6 md:p-8 lg:p-12">
            <div className="mx-auto max-w-6xl">
                <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                            White Villa <span className="text-emerald-600">වසන්ත උත්සවය – 2026</span>
                        </h1>
                        <p className="mt-2 text-slate-500 text-sm sm:text-base font-medium">සියලුම ක්‍රීඩා සහ සහභාගීවන්නන්ගේ සවිස්තරාත්මක වාර්තාව.</p>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                        <Link
                            href="/"
                            className="premium-button bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm"
                        >
                            ලියාපදිංචිය
                        </Link>
                        <div className="flex rounded-xl sm:rounded-2xl border border-emerald-100 overflow-hidden shadow-sm">
                            <button
                                onClick={exportToCSV}
                                className="bg-white px-3 sm:px-4 py-2 text-[10px] sm:text-xs font-bold text-emerald-700 hover:bg-emerald-50 transition-colors border-r border-emerald-100"
                            >
                                Export CSV
                            </button>
                            <button
                                onClick={() => exportToPDFDirect('full-report-content', 'full_report.pdf')}
                                className="emerald-gradient px-3 sm:px-4 py-2 text-[10px] sm:text-xs font-bold transition-opacity hover:opacity-90"
                            >
                                Download Full PDF
                            </button>
                        </div>
                    </div>
                </header>

                <div className="space-y-12" id="full-report-content">
                    {rows.length === 0 ? (
                        <div className="glass-card rounded-[2.5rem] py-24 text-center">
                            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-slate-100">
                                <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-black text-slate-900">තවමත් දත්ත ඇතුලත් කර නැත</h2>
                            <p className="text-slate-500 mt-2 font-medium">පළමුව ලියාපදිංචි කිරීමේ පෝරමය හරහා දත්ත ඇතුලත් කරන්න.</p>
                            <Link href="/" className="mt-8 premium-button inline-block emerald-gradient">දත්ත ඇතුලත් කරන්න</Link>
                        </div>
                    ) : (
                        report.map(([sportName, list]: [string, Participant[]], sportIdx) => {
                            const maleCount = list.filter((x: Participant) => x.gender === Gender.Male).length;
                            const femaleCount = list.filter((x: Participant) => x.gender === Gender.Female).length;

                            return (
                                <div
                                    key={sportName}
                                    id={`sport-${sportIdx}`}
                                    className="glass-card rounded-[1.5rem] sm:rounded-[2rem] lg:rounded-[2.5rem] overflow-hidden sport-section"
                                    data-sport={sportName}
                                    style={{ animationDelay: `${sportIdx * 100}ms` }}
                                >
                                    <div className="p-6 sm:p-8 lg:p-10 border-b border-slate-100 bg-slate-50/30">
                                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                                            <div>
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="w-1.5 sm:w-2 h-6 sm:h-8 bg-emerald-500 rounded-full" />
                                                    <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight">{sportName}</h3>
                                                </div>
                                                <div className="flex flex-wrap gap-2 sm:gap-3">
                                                    <span className="bg-white border border-slate-100 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[9px] sm:text-xs font-black text-slate-500 uppercase tracking-widest">
                                                        Total: <span className="text-emerald-600">{list.length}</span>
                                                    </span>
                                                    <span className="bg-white border border-slate-100 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[9px] sm:text-xs font-black text-slate-500 uppercase tracking-widest">
                                                        සහභාගීත්වය: <span className="text-blue-500">M:{maleCount}</span> • <span className="text-pink-500">F:{femaleCount}</span>
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex rounded-xl border border-emerald-100 overflow-hidden shadow-sm h-fit">
                                                <button
                                                    onClick={() => exportSportToCSV(sportName, list)}
                                                    className="bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-700 hover:bg-emerald-50 transition-colors border-r border-emerald-100"
                                                >
                                                    CSV
                                                </button>
                                                <button
                                                    onClick={() => exportToPDFDirect(`sport-${sportIdx}`, `report_${sportName}.pdf`)}
                                                    className="bg-emerald-600 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white hover:bg-emerald-700 transition-colors"
                                                >
                                                    Download PDF
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto scrollbar-hide">
                                        <table className="w-full text-left min-w-[600px] sm:min-w-full">
                                            <thead>
                                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                                    <th className="px-4 sm:px-8 py-4 sm:py-5 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400">ක්‍රීඩකයා / විස්තර</th>
                                                    <th className="px-4 sm:px-8 py-4 sm:py-5 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400">වයස/කාණ්ඩය</th>
                                                    <th className="px-4 sm:px-8 py-4 sm:py-5 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">ලිංගිකතාව</th>
                                                    <th className="px-4 sm:px-8 py-4 sm:py-5 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">ලැබූ ස්ථානය</th>
                                                    <th className="px-4 sm:px-8 py-4 sm:py-5 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 no-export text-right">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {list.map((p: Participant) => (
                                                    <tr key={p.id} className="hover:bg-emerald-50/30 transition-colors group">
                                                        <td className="px-4 sm:px-8 py-4 sm:py-6">
                                                            <div className="font-bold text-slate-900 text-sm sm:text-base">{p.name}</div>
                                                            <div className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 sm:mt-1 font-medium">{p.address}</div>
                                                            <div className="text-[10px] sm:text-[11px] text-emerald-600 font-bold mt-0.5">{p.phone}</div>
                                                        </td>
                                                        <td className="px-4 sm:px-8 py-4 sm:py-6">
                                                            <div className="flex flex-col">
                                                                <span className="text-xs sm:text-sm font-bold text-slate-700">{p.age} Yrs</span>
                                                                <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-tighter">{getAgeGroup(p.age)}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 sm:px-8 py-4 sm:py-6 text-center">
                                                            <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-widest ${p.gender === Gender.Male ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'
                                                                }`}>
                                                                {p.gender}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 sm:px-8 py-4 sm:py-6 text-center">
                                                            <select
                                                                className={`premium-input py-1.5 sm:py-2 px-2 sm:px-3 text-[10px] sm:text-xs font-black uppercase tracking-widest border-none ring-1 ring-slate-100 focus:ring-emerald-500 w-28 sm:w-40 mx-auto ${p.place ? 'bg-emerald-600 text-white focus:bg-emerald-700 ring-0' : 'bg-slate-50 text-slate-500 shadow-none'
                                                                    }`}
                                                                value={p.place || ""}
                                                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPlace(p.id, e.target.value)}
                                                            >
                                                                <option value="">ලැබූ ස්ථානය</option>
                                                                <option value="1st">1st Place</option>
                                                                <option value="2nd">2nd Place</option>
                                                                <option value="3rd">3rd Place</option>
                                                            </select>
                                                        </td>
                                                        <td className="px-8 py-6 text-right no-export">
                                                            <button
                                                                onClick={() => removeRow(p.id)}
                                                                className="p-2 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                                            >
                                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {rows.length > 0 && (
                    <div className="mt-20 p-12 glass-card rounded-[3rem] emerald-gradient relative overflow-hidden text-center border-none shadow-2xl shadow-emerald-200">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                        <div className="relative max-w-2xl mx-auto">
                            <h2 className="text-3xl font-black tracking-tight mb-4">සියලුම ක්‍රීඩා අවසන් ද?</h2>
                            <p className="text-emerald-50 text-lg font-medium mb-8">
                                ඔබ සතුව දැන් ක්‍රීඩකයන් {rows.length}කගේ දත්ත ඇත. සියලුම ජයග්‍රාහකයන් තේරූ පසු සම්පූර්ණ වාර්තාව CSV ලෙස බාගත කරගැනීමට මතක තබා ගන්න.
                            </p>
                            <button
                                onClick={exportToCSV}
                                className="premium-button bg-white text-emerald-900 hover:bg-emerald-50 border-none scale-110"
                            >
                                අවසන් ලිපොත්ත බාගත කරන්න
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
