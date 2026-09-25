import React, { useState, useEffect } from 'react';

export default function HelpCenter() {
  const [categories, setCategories] = useState([]);
  const [openIndex, setOpenIndex] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/help')
      .then((res) => res.json())
      .then((res) => {
        if (res.success) {
          setCategories(res.data.categorias);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error al cargar el centro de ayuda:', err);
        setLoading(false);
      });
  }, []);

  const toggleAccordion = (catIdx, pregIdx) => {
    const key = `${catIdx}-${pregIdx}`;
    setOpenIndex(openIndex === key ? null : key);
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Cargando guías de autogestión...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8 border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-800">Centro de Ayuda y Autogestión</h1>
        <p className="text-gray-600 mt-1">
          Guía paso a paso para la gestión de mensualidades, expedientes de documentos y alertas.
        </p>
      </div>

      <div className="space-y-8">
        {categories.map((cat, catIdx) => (
          <div key={cat.id} className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-indigo-600 rounded-full"></span>
              {cat.titulo}
            </h2>

            <div className="space-y-3">
              {cat.preguntas.map((item, pregIdx) => {
                const key = `${catIdx}-${pregIdx}`;
                const isOpen = openIndex === key;

                return (
                  <div key={pregIdx} className="border rounded-md overflow-hidden">
                    <button
                      onClick={() => toggleAccordion(catIdx, pregIdx)}
                      className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 flex justify-between items-center transition-colors font-medium text-gray-700"
                    >
                      <span>{item.pregunta}</span>
                      <span className="text-gray-400">{isOpen ? '−' : '+'}</span>
                    </button>
                    {isOpen && (
                      <div className="px-4 py-3 bg-white text-gray-600 text-sm border-t leading-relaxed">
                        {item.respuesta}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}