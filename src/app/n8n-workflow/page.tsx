import Link from "next/link";

export default function Fitur5Page() {
  return (
    <div className="min-h-screen p-8">
      <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">
        ← Kembali ke Home
      </Link>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Fitur 5</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Ini adalah halaman untuk Fitur 5. Silakan tambahkan konten sesuai kebutuhan Anda.
        </p>
      </div>
    </div>
  );
}
