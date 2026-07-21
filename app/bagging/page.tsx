'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';

interface BaggingRow {
  'Tanggal'?: any;
  'No Resi'?: any;
  'Agen'?: any;
  'Kode Layanan'?: any;
  'Status Bagging'?: any;
  [key: string]: any;
}

export default function BaggingPage() {
  const [baggingData, setBaggingData] = useState<BaggingRow[]>([]);
  const [isProcessingExcel, setIsProcessingExcel] = useState(false);
  
  // State untuk menyimpan nama agen yang pesannya baru saja disalin
  const [copiedAgen, setCopiedAgen] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingExcel(true);
    let allParsedRows: BaggingRow[] = [];
    let filesProcessed = 0;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const bstr = evt.target?.result;
          const workbook = XLSX.read(bstr, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];

          const jsonData = XLSX.utils.sheet_to_json<BaggingRow>(sheet, { range: 1 });
          allParsedRows = [...allParsedRows, ...jsonData];
        } catch (err) {
          console.error(`Error reading ${file.name}:`, err);
        }

        filesProcessed++;
        if (filesProcessed === files.length) {
          setBaggingData(allParsedRows);
          setIsProcessingExcel(false);
        }
      };
      reader.readAsBinaryString(file);
    });
  };

  // Fungsi Salin Pesan
  const handleCopyMessage = (text: string, agenName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAgen(agenName);
    setTimeout(() => {
      setCopiedAgen(null);
    }, 2000); // Reset status tersalin setelah 2 detik
  };

  const filteredBagging = baggingData.filter(
    (row) => String(row['Status Bagging'] || '').trim().toLowerCase() === 'belum dibagging'
  );

  const groupedByAgen = filteredBagging.reduce<{ [key: string]: BaggingRow[] }>((acc, row) => {
    const agenName = String(row['Agen'] || 'LAINNYA').trim();
    if (!acc[agenName]) acc[agenName] = [];
    acc[agenName].push(row);
    return acc;
  }, {});

  return (
    <main className="max-w-7xl mx-auto p-6 md:p-10 space-y-8">
      {/* Header Bagging */}
      <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80 space-y-3">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          🛍️ Otomasi Pengingat Bagging Resi
        </h2>
        <p className="text-xs text-slate-400">
          Unggah file Excel KurLog (.xlsx) untuk memfilter paket yang belum dibagging dan langsung menghasilkan template link pesan WhatsApp per agen.
        </p>

        {/* Upload Input */}
        <div className="pt-2">
          <input
            type="file"
            accept=".xlsx"
            multiple
            onChange={handleFileUpload}
            className="block w-full text-xs text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer bg-slate-950/80 p-2 rounded-xl border border-slate-800"
          />
        </div>
      </div>

      {/* Metrics */}
      {baggingData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-slate-900/70 p-5 rounded-2xl border border-slate-800">
            <p className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">Total Resi Diunggah</p>
            <h3 className="text-3xl font-black text-white mt-1">{baggingData.length} Paket</h3>
          </div>
          <div className="bg-slate-900/70 p-5 rounded-2xl border border-amber-500/20">
            <p className="text-[11px] uppercase tracking-wider text-amber-400 font-bold">Belum Dibagging</p>
            <h3 className="text-3xl font-black text-amber-400 mt-1">{filteredBagging.length} Paket</h3>
          </div>
          <div className="bg-slate-900/70 p-5 rounded-2xl border border-blue-500/20">
            <p className="text-[11px] uppercase tracking-wider text-blue-400 font-bold">Jumlah Agen Terdampak</p>
            <h3 className="text-3xl font-black text-blue-400 mt-1">{Object.keys(groupedByAgen).length} Agen</h3>
          </div>
        </div>
      )}

      {/* Cards Per Agen */}
      {isProcessingExcel ? (
        <div className="text-center py-12 text-slate-400">Membaca & Memproses File Excel...</div>
      ) : Object.keys(groupedByAgen).length > 0 ? (
        <div className="space-y-6">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">📋 Draft Pesan Pengingat per Agen</h3>

          {Object.entries(groupedByAgen).map(([agenName, items]) => {
            const sampleDate = items[0]?.['Tanggal'] || '-';
            const resiListStr = items.map((i) => i['No Resi']).join('\n');

            const pesanTemplate = `Selamat pagi pak, mohon maaf mengganggu waktunya pak, kami sampaikan ada paket di agen bapak ${agenName} pada Tanggal ${sampleDate} yang belum dibagging ya pak?\nMohon dibantu untuk segera dibagging.\n\nBerikut informasi resinya :\n${resiListStr}`;

            const encodedMessage = encodeURIComponent(pesanTemplate);
            const waUrl = `https://web.whatsapp.com/send?text=${encodedMessage}`;
            const isCopied = copiedAgen === agenName;

            return (
              <div key={agenName} className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-4">
                  <h4 className="text-base font-bold text-white flex items-center gap-2">
                    🏢 {agenName}
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      {items.length} Paket Belum Dibagging
                    </span>
                  </h4>

                  {/* Tombol Aksi (Salin & Kirim WA) */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyMessage(pesanTemplate, agenName)}
                      className={`font-semibold text-xs px-3.5 py-2.5 rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                        isCopied
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                      }`}
                    >
                      {isCopied ? '✓ Tersalin!' : '📋 Salin Pesan'}
                    </button>

                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      💬 Kirim ke WA Agen
                    </a>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <p className="text-[11px] text-slate-400 font-medium">Draft Pesan WhatsApp:</p>
                  <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs font-mono text-emerald-400 whitespace-pre-wrap selection:bg-emerald-900">
                    {pesanTemplate}
                  </pre>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-950 text-slate-400 uppercase">
                      <tr>
                        <th className="p-3">Tanggal</th>
                        <th className="p-3">No Resi</th>
                        <th className="p-3">Kode Layanan</th>
                        <th className="p-3">Status Bagging</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50 text-slate-300">
                      {items.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/30">
                          <td className="p-3">{String(row['Tanggal'] || '-')}</td>
                          <td className="p-3 font-mono font-bold text-blue-400">{String(row['No Resi'] || '-')}</td>
                          <td className="p-3">{String(row['Kode Layanan'] || '-')}</td>
                          <td className="p-3 text-amber-400 font-semibold">{String(row['Status Bagging'] || '-')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800/80">
          💡 Silakan unggah file Excel KurLog (.xlsx) di atas untuk melihat draft pengingat bagging per agen.
        </div>
      )}
    </main>
  );
}