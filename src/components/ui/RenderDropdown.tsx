import React, { useState } from 'react';

type OptionType = {
  label: string;
  value: string;
};

type RenderDropdownProps = {
  field: any;
  options: OptionType[];
  placeholder: string;
  value: string | null;
  onChange: (value: string | null) => void;
};

const RenderDropdown: React.FC<RenderDropdownProps> = ({
  field,
  options,
  placeholder,
  value,
  onChange,
}) => {
  const [searchText, setSearchText] = useState(value ? value : '');

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className="relative">
      <input
        {...field}
        placeholder={placeholder}
        value={searchText}
        onChange={(e) => {
          setSearchText(e.target.value);
          onChange(e.target.value);
        }}
        className="input-class" // Add appropriate styling
      />
      {filteredOptions.length > 0 && (
        <div className="absolute z-10 mt-2 w-full rounded-md bg-white shadow-lg">
          {filteredOptions.map((option) => (
            <div
              key={option.value}
              onClick={() => {
                setSearchText(option.label);
                onChange(option.value);
              }}
              className="cursor-pointer px-4 py-2 hover:bg-gray-100"
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RenderDropdown;
