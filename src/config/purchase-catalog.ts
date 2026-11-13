// Demo equipment and vendors. Names and prices are illustrative, not real suppliers.
export const VENDORS = ['KNX Supplier (demo)', 'Electro Wholesale (demo)'];

export interface EquipmentProduct {
  name: string;
  vendor: string;
  cost: number;
  price: number;
}

export const EQUIPMENT: EquipmentProduct[] = [
  { name: 'KNX actuator, 8-channel [demo price]', vendor: VENDORS[0] ?? '', cost: 9000, price: 12000 },
  { name: 'KNX power supply 640 mA [demo price]', vendor: VENDORS[0] ?? '', cost: 6000, price: 8000 },
  { name: 'KNX presence sensor [demo price]', vendor: VENDORS[0] ?? '', cost: 3500, price: 4800 },
  { name: 'Smart home controller [demo price]', vendor: VENDORS[1] ?? '', cost: 18000, price: 24000 },
  { name: 'KNX/EIB cable, 100 m reel [demo price]', vendor: VENDORS[1] ?? '', cost: 2500, price: 3400 },
];

export const SPEC_TASK_NAME = 'Specification approval with client';
export const DONE_STAGE_NAME = 'Done';
