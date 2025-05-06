// src/components/layout/DateFilterModal.jsx
import React, { useState } from 'react';
import DatePicker from 'react-datepicker';

export default function DateFilterModal({ isOpen, onClose, onApply }) {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const handleConfirm = () => {
    if (startDate && endDate) {
      onApply({ start: startDate, end: endDate }); // ✅ dispara corretamente
      onClose(); // fecha o modal após aplicar
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Selecionar Período</h2>

        <div className="date-pickers">
          <div>
            <label>Data Inicial</label>
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              selectsStart
              startDate={startDate}
              endDate={endDate}
              dateFormat="dd/MM/yyyy"
              placeholderText="Selecionar início"
              className="datepicker-input"
            />
          </div>

          <div>
            <label>Data Final</label>
            <DatePicker
              selected={endDate}
              onChange={(date) => setEndDate(date)}
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              minDate={startDate}
              dateFormat="dd/MM/yyyy"
              placeholderText="Selecionar fim"
              className="datepicker-input"
            />
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Cancelar</button>
          <button className="btn-confirm" onClick={handleConfirm}>Aplicar Filtro</button>
        </div>
      </div>
    </div>
  );
}
