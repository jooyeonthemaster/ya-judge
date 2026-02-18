interface CustomerFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
}

interface CustomerFormProps {
  formData: CustomerFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  focusRing: string;
  focusBorder: string;
}

const fields = [
  { id: 'name', label: '고객명', type: 'text', required: true, placeholder: '홍길동' },
  { id: 'email', label: '이메일', type: 'email', required: true, placeholder: 'example@email.com' },
  { id: 'phone', label: '전화번호', type: 'tel', required: true, placeholder: '010-0000-0000' },
  { id: 'address', label: '주소', type: 'text', required: false, placeholder: '선택 사항' },
] as const;

export default function CustomerForm({ formData, onChange, focusRing, focusBorder }: CustomerFormProps) {
  const inputClass = `w-full px-4 py-3 border border-gray-200 rounded-xl bg-white text-gray-900 placeholder-gray-400 text-sm transition-all focus:ring-2 ${focusRing} ${focusBorder} focus:outline-none`;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <h2 className="text-sm font-semibold text-gray-500 mb-4 tracking-wide uppercase">
        고객 정보
      </h2>
      <div className="grid grid-cols-1 gap-3">
        {fields.map((field) => (
          <div key={field.id}>
            <label htmlFor={field.id} className="block text-xs font-medium text-gray-600 mb-1.5">
              {field.label} {field.required && <span className="text-red-400">*</span>}
            </label>
            <input
              id={field.id}
              name={field.id}
              type={field.type}
              required={field.required}
              placeholder={field.placeholder}
              value={formData[field.id as keyof CustomerFormData]}
              onChange={onChange}
              className={inputClass}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
