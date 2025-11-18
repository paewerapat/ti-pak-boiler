"use client";

import { useState } from "react";
import DatePicker from "react-datepicker";
import { Calendar } from "lucide-react";
import { th } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";

interface DateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function DateTimePicker({
  value,
  onChange,
  placeholder,
}: DateTimePickerProps) {
  // ✅ ตอน parse value กลับมาแสดง ต้องบวก +7 ชั่วโมง (เพราะเราลบไปตอนส่ง)
  const dateValue = value 
    ? new Date(new Date(value).getTime() + 7 * 60 * 60 * 1000) 
    : null;

  const handleChange = (date: Date | null) => {
    if (date) {
      // ✅ ลบ 7 ชั่วโมงก่อนส่งค่า (เพราะ API จะบวกกลับเข้าไป +7)
      const adjustedDate = new Date(date.getTime() - 7 * 60 * 60 * 1000);
      
      const year = adjustedDate.getFullYear();
      const month = String(adjustedDate.getMonth() + 1).padStart(2, "0");
      const day = String(adjustedDate.getDate()).padStart(2, "0");
      const hours = String(adjustedDate.getHours()).padStart(2, "0");
      const minutes = String(adjustedDate.getMinutes()).padStart(2, "0");
      const seconds = "00";

      const formatted = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      onChange(formatted);
    } else {
      onChange("");
    }
  };

  return (
    <div className="relative w-full">
      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 z-10 pointer-events-none" />
      <DatePicker
        selected={dateValue}
        onChange={handleChange}
        showTimeSelect
        timeFormat="HH:mm"
        timeIntervals={15}
        timeCaption="เวลา"
        dateFormat="dd/MM/yyyy HH:mm"
        locale={th}
        placeholderText={placeholder || "เลือกวันที่และเวลา"}
        withPortal
        portalId="root-portal"
        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
      />
    </div>
  );
}