"use client";

import React, { useEffect, useMemo, useState, ChangeEvent } from "react";
import Link from "next/link";
import { Gender, Participant, SportsByGender, getAgeGroup } from "@/lib/avrudu";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { domToPng } from "modern-screenshot";

function uid() {
  return crypto.randomUUID();
}

export default function Page() {
  const [name, setName] = useState("");
  const [age, setAge] = useState<string>("");
  const [gender, setGender] = useState<Gender | "">("");
  const [sport, setSport] = useState<string>("");
  const [address, setAddress] = useState("");
  const [dob, setDob] = useState("");
  const [phone, setPhone] = useState("");
  const [nic, setNic] = useState("");
  const [division, setDivision] = useState("");
  const [district, setDistrict] = useState("");

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

  // Save to LocalStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("avrudu_participants", JSON.stringify(rows));
    }
  }, [rows, isLoaded]);

  const sportOptions = useMemo(() => {
    if (!gender) return [];
    return SportsByGender[gender as Gender];
  }, [gender]);

  // Sport-wise report: { sport -> participants[] }
  const report = useMemo(() => {
    const map = new Map<string, Participant[]>();
    for (const r of rows) {
      if (!map.has(r.sport)) map.set(r.sport, []);
      map.get(r.sport)!.push(r);
    }
    // sort sports alphabetically (Sinhala order depends on font; still ok)
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [rows]);

  function resetForm() {
    setName("");
    setAge("");
    setGender("");
    setSport("");
    setAddress("");
    setDob("");
    setPhone("");
    setNic("");
    setDivision("");
    setDistrict("");
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const trimmed = name.trim();
    const ageNum = Number(age);

    if (!trimmed) return alert("නම දාන්න");
    if (!age || Number.isNaN(ageNum) || ageNum <= 0) return alert("වයස හරිද බලන්න");
    if (!address.trim()) return alert("ලිපිනය දාන්න");
    if (!dob) return alert("උපන් දිනය දාන්න");
    if (!phone.trim()) return alert("දුරකථන අංකය දාන්න");
    if (!nic.trim()) return alert("ජාතික හැදුනුම්පත් අංකය දාන්න");
    if (!division.trim()) return alert("ග්‍රාමී සේවා වසම දාන්න");
    if (!district.trim()) return alert("දිස්ත්‍රික්කය දාන්න");
    if (!gender) return alert("ලිංගිකතාව තෝරන්න");
    if (!sport) return alert("ක්රීඩාව තෝරන්න");

    const newRow: Participant = {
      id: uid(),
      name: trimmed,
      age: ageNum,
      gender,
      sport,
      address: address.trim(),
      dob,
      phone: phone.trim(),
      nic: nic.trim(),
      division: division.trim(),
      district: district.trim(),
      createdAt: new Date().toISOString(),
    };

    setRows((prev) => [newRow, ...prev]);
    resetForm();
  }

  function onGenderChange(val: string) {
    // when gender changes, clear sport
    setGender(val as Gender);
    setSport("");
  }

  function removeRow(id: string) {
    setRows((prev) => prev.filter((x) => x.id !== id));
  }

  function setPlace(id: string, place: string) {
    setRows((prev: Participant[]) =>
      prev.map((r: Participant) => (r.id === id ? { ...r, place: place || undefined } : r))
    );
  }

  function exportToCSV() {
    if (rows.length === 0) return;
    const headers = ["Name", "Address", "DOB", "Phone", "NIC", "Division", "District", "Age", "Age Group", "Gender", "Sport", "Place", "Time"];
    const csvRows = rows.map((r: Participant) => [
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

    const csvContent =
      headers.join(",") + "\n" + csvRows.map((r: any[]) => r.join(",")).join("\n");
    const blob = new Blob(["\ufeff", csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `avrudu_participants_${new Date().getTime()}.csv`);
    link.click();
  }

  function exportToPDF() {
    if (rows.length === 0) return;
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text("Avrudu 2026 - Full Sports Report", 14, 22);
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

  async function exportToPDFDirect(elementId: string, fileName: string) {
    const element = document.getElementById(elementId);
    if (!element) return;

    try {
      const dataUrl = await domToPng(element, {
        scale: 2,
        backgroundColor: "#ffffff",
      });
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 190;

      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve) => img.onload = resolve);
      const imgHeight = (img.height * imgWidth) / img.width;

      pdf.addImage(dataUrl, 'PNG', 10, 10, imgWidth, imgHeight);
      pdf.save(fileName);
    } catch (e) {
      console.error(e);
      alert("දෝෂයක් ඇති විය.");
    }
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8 lg:p-12">
      <title>White Villa වසන්ත උත්සවය – 2026</title>
      <div className="mx-auto max-w-6xl grid gap-6 lg:gap-8 lg:grid-cols-5 items-start">
        {/* FORM SECTION */}
        <div className="lg:col-span-3 glass-card rounded-[1.5rem] sm:rounded-[2rem] lg:rounded-[2.5rem] p-6 sm:p-8 lg:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full -mr-32 -mt-32 blur-3xl" />

          <div className="relative">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              White Villa <span className="text-emerald-600">වසන්ත උත්සවය – 2026</span>
            </h1>
            <p className="mt-3 text-slate-500 font-medium max-w-md">
              අවුරුදු උත්සවයේ ක්‍රීඩා සඳහා සහභාගී වීමට පහත තොරතුරු නිවැරදිව පිරවුම් කරන්න.
            </p>

            <form onSubmit={onSubmit} className="mt-8 sm:mt-10 space-y-4 sm:space-y-6">
              <div className="grid gap-4 sm:gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-black uppercase tracking-widest text-slate-400 ml-1">
                    සම්පූර්ණ නම
                  </label>
                  <input
                    className="premium-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Kasun Perera"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-black uppercase tracking-widest text-slate-400 ml-1">
                    වයස (අවුරුදු)
                  </label>
                  <input
                    className="premium-input"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="24"
                    inputMode="numeric"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-black uppercase tracking-widest text-slate-400 ml-1">
                  ලිපිනය
                </label>
                <textarea
                  className="premium-input min-h-[80px] py-3"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street, City"
                />
              </div>

              <div className="grid gap-4 sm:gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-black uppercase tracking-widest text-slate-400 ml-1">
                    උපන් දිනය
                  </label>
                  <input
                    type="date"
                    className="premium-input"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-black uppercase tracking-widest text-slate-400 ml-1">
                    දුරකථන අංකය (WhatsApp)
                  </label>
                  <input
                    className="premium-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="077 123 4567"
                    type="tel"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-black uppercase tracking-widest text-slate-400 ml-1">
                    ජාතික හැදුනුම්පත් අංකය
                  </label>
                  <input
                    className="premium-input"
                    value={nic}
                    onChange={(e) => setNic(e.target.value)}
                    placeholder="199012345678"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-black uppercase tracking-widest text-slate-400 ml-1">
                    ලිංගිකතාව
                  </label>
                  <select
                    className="premium-input appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M5%207.5L10%2012.5L15%207.5%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%221.66667%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E')] bg-[length:20px_20px] bg-[right_1rem_center] bg-no-repeat"
                    value={gender}
                    onChange={(e) => onGenderChange(e.target.value)}
                  >
                    <option value="">තෝරන්න</option>
                    <option value={Gender.Male}>පුරුෂ (Male)</option>
                    <option value={Gender.Female}>ස්ත්‍රී (Female)</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-black uppercase tracking-widest text-slate-400 ml-1">
                    ග්‍රාමී සේවා වසම
                  </label>
                  <input
                    className="premium-input"
                    value={division}
                    onChange={(e) => setDivision(e.target.value)}
                    placeholder="Walgama"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-black uppercase tracking-widest text-slate-400 ml-1">
                    දිස්ත්‍රික්කය
                  </label>
                  <input
                    className="premium-input"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="Matara"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-black uppercase tracking-widest text-slate-400 ml-1">
                  තෝරාගත් ක්‍රීඩාව
                </label>
                <select
                  className="premium-input appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M5%207.5L10%2012.5L15%207.5%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%221.66667%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E')] bg-[length:20px_20px] bg-[right_1rem_center] bg-no-repeat disabled:opacity-50"
                  value={sport}
                  onChange={(e) => setSport(e.target.value)}
                  disabled={!gender}
                >
                  <option value="">
                    {!gender ? "පළමුව ලිංගිකතාව තෝරන්න" : "ක්‍රීඩාව තෝරන්න"}
                  </option>
                  {sportOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <button
                className="premium-button w-full flex items-center justify-center gap-3 group emerald-gradient border-none"
                type="submit"
              >
                ලියාපදිංචිය තහවුරු කරන්න
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </form>
          </div>
        </div>

        {/* SUMMARY SECTION */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card rounded-[1.5rem] sm:rounded-[2rem] lg:rounded-[2.5rem] p-6 sm:p-8 overflow-hidden relative" id="progress-report-card">
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-yellow-500/10 rounded-full blur-3xl animate-pulse" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">ප්‍රගති වාර්තාව</h2>
                <div className="flex gap-2">
                  <button
                    onClick={exportToCSV}
                    className="p-2 bg-slate-100 rounded-xl text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 transition-all border border-slate-200/50"
                    title="Export CSV"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => exportToPDFDirect('progress-report-card', 'progress_report.pdf')}
                    className="p-2 bg-slate-100 rounded-xl text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 transition-all border border-slate-200/50"
                    title="Download PDF"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <Link
                    href="/report"
                    className="p-2 bg-slate-100 rounded-xl text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 transition-all border border-slate-200/50"
                    title="Full Report"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </Link>
                </div>
              </div>

              <div className="mt-6 sm:mt-8 grid grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-white/50 border border-slate-100 p-3 sm:p-5 rounded-2xl sm:rounded-3xl group hover:border-emerald-200 transition-colors">
                  <div className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Total Players</div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 group-hover:text-emerald-600 transition-colors">{rows.length}</div>
                </div>
                <div className="bg-white/50 border border-slate-100 p-3 sm:p-5 rounded-2xl sm:rounded-3xl group hover:border-emerald-200 transition-colors">
                  <div className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Active Sports</div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 group-hover:text-emerald-600 transition-colors">{report.length}</div>
                </div>
              </div>

              {rows.length > 0 ? (
                <div className="mt-8 space-y-3">
                  <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4">පසුගිය ලියාපදිංචි කිරීම්</h3>
                  {rows.slice(0, 4).map((p, idx) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-4 bg-white/40 p-3 rounded-2xl border border-white/50 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all"
                      style={{ transitionDelay: `${idx * 50}ms` }}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${p.gender === Gender.Male ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'
                        }`}>
                        {p.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-slate-900 truncate">{p.name}</div>
                        <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">{p.sport}</div>
                      </div>
                    </div>
                  ))}
                  <Link href="/report" className="block text-center mt-6 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-emerald-600 transition-colors">
                    View complete list →
                  </Link>
                </div>
              ) : (
                <div className="mt-12 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                    <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <p className="text-sm font-bold text-slate-400">නව සහභාගීවන්නෙකු එකතු කරන්න</p>
                </div>
              )}
            </div>
          </div>

          <div className="emerald-gradient rounded-[1.5rem] sm:rounded-[2rem] lg:rounded-[2.5rem] p-6 sm:p-8 relative overflow-hidden shadow-2xl shadow-emerald-200">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
            <h3 className="text-lg font-black tracking-tight relative mb-2">සංවිධාන කමිටුව</h3>
            <p className="text-emerald-50/80 text-sm font-medium relative leading-relaxed">
              සියලුම දත්ත ඔබගේ බ්‍රවුසරයේ (Local Storage) සුරැකෙන බැවින් අන්තර්ජාලය නොමැතිවද මෙය භාවිතා කළ හැක.
            </p>
          </div>
        </div>
      </div>
    </div >
  );
}
