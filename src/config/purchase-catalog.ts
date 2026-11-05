// Demo equipment and vendors. Names and prices are illustrative, not Gravity's real suppliers.
export const VENDORS = ['Постачальник KNX (демо)', 'Електротехніка Опт (демо)'];

export interface EquipmentProduct {
  name: string;
  vendor: string;
  cost: number;
  price: number;
}

export const EQUIPMENT: EquipmentProduct[] = [
  { name: 'KNX актуатор 8-канальний [демо-ціна]', vendor: VENDORS[0] ?? '', cost: 9000, price: 12000 },
  { name: 'KNX блок живлення 640 mA [демо-ціна]', vendor: VENDORS[0] ?? '', cost: 6000, price: 8000 },
  { name: 'Датчик присутності KNX [демо-ціна]', vendor: VENDORS[0] ?? '', cost: 3500, price: 4800 },
  { name: 'Контролер розумного дому [демо-ціна]', vendor: VENDORS[1] ?? '', cost: 18000, price: 24000 },
  { name: 'Кабель KNX/EIB, бухта 100 м [демо-ціна]', vendor: VENDORS[1] ?? '', cost: 2500, price: 3400 },
];

export const SPEC_TASK_NAME = 'Погодження специфікації з клієнтом';
export const DONE_STAGE_NAME = 'Готово';
