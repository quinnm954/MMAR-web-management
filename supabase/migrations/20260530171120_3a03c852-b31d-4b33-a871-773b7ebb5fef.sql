
DO $$
DECLARE
  insp UUID := '85ef50ac-4387-4f75-bf8d-06d985ba6fe3';
BEGIN
  DELETE FROM public.inspection_items WHERE inspection_id = insp;

  INSERT INTO public.inspection_items (inspection_id, category, item_name, status, notes, sort_order, photo_urls) VALUES
  -- AC Service Inspection
  (insp, 'AC Service Inspection', 'Compressor clutch engagement', 'na', NULL, 0, '{}'),
  (insp, 'AC Service Inspection', 'Refrigerant pressures (high/low)', 'na', NULL, 1, '{}'),
  (insp, 'AC Service Inspection', 'Condenser fins and airflow', 'na', NULL, 2, '{}'),
  (insp, 'AC Service Inspection', 'Cabin air filter', 'na', NULL, 3, '{}'),
  (insp, 'AC Service Inspection', 'Blower motor operation', 'na', NULL, 4, '{}'),
  (insp, 'AC Service Inspection', 'Drive belt and tensioner', 'fail', 'Belt felt stretched and cracked; pulleys rusted', 5, '{}'),
  (insp, 'AC Service Inspection', 'AC lines for oil residue', 'na', NULL, 6, '{}'),
  (insp, 'AC Service Inspection', 'Evaporator drain', 'na', NULL, 7, '{}'),

  -- Battery & Charging Inspection
  (insp, 'Battery & Charging Inspection', 'Battery load test', 'na', NULL, 8, '{}'),
  (insp, 'Battery & Charging Inspection', 'Battery terminals and clamps', 'pass', NULL, 9, '{}'),
  (insp, 'Battery & Charging Inspection', 'Ground straps', 'na', NULL, 10, '{}'),
  (insp, 'Battery & Charging Inspection', 'Alternator output', 'na', NULL, 11, '{}'),
  (insp, 'Battery & Charging Inspection', 'Starter draw', 'na', NULL, 12, '{}'),
  (insp, 'Battery & Charging Inspection', 'Drive belt tension', 'fail', 'Belt felt stretched and cracked; pulleys rusted', 13, '{}'),
  (insp, 'Battery & Charging Inspection', 'Charging system harness', 'na', NULL, 14, '{}'),
  (insp, 'Battery & Charging Inspection', 'Corrosion / acid leak', 'na', NULL, 15, '{}'),

  -- Brake Job Inspection
  (insp, 'Brake Job Inspection', 'Brake pads remaining', 'fail', 'Front pads low; rear drum/shoe', 16, '{}'),
  (insp, 'Brake Job Inspection', 'Rotor condition and thickness', 'fail', 'Front rotors rusted; rear drum/shoe', 17, '{}'),
  (insp, 'Brake Job Inspection', 'Calipers and slide pins', 'na', NULL, 18, '{}'),
  (insp, 'Brake Job Inspection', 'Brake lines and hoses', 'warning', 'Age', 19, '{}'),
  (insp, 'Brake Job Inspection', 'Struts / shocks', 'na', NULL, 20, '{}'),
  (insp, 'Brake Job Inspection', 'Tie rod ends', 'na', NULL, 21, '{}'),
  (insp, 'Brake Job Inspection', 'Ball joints', 'na', NULL, 22, '{}'),
  (insp, 'Brake Job Inspection', 'Control arm bushings', 'na', NULL, 23, '{}'),
  (insp, 'Brake Job Inspection', 'Sway bar links', 'na', NULL, 24, '{}'),
  (insp, 'Brake Job Inspection', 'Wheel bearings', 'na', NULL, 25, '{}'),
  (insp, 'Brake Job Inspection', 'Tire tread and wear pattern', 'fail', 'LF/RF at wear indicators; LR/RR need replacement soon', 26, '{}'),
  (insp, 'Brake Job Inspection', 'Lug nuts torque', 'na', NULL, 27, '{}'),

  -- Cooling System Inspection
  (insp, 'Cooling System Inspection', 'Upper / lower radiator hoses', 'warning', 'Original belts & hoses flagged; verify hose condition', 28, '{}'),
  (insp, 'Cooling System Inspection', 'Heater hoses', 'na', NULL, 29, '{}'),
  (insp, 'Cooling System Inspection', 'Water pump weep / play', 'na', NULL, 30, '{}'),
  (insp, 'Cooling System Inspection', 'Thermostat operation', 'na', NULL, 31, '{}'),
  (insp, 'Cooling System Inspection', 'Radiator cap', 'na', NULL, 32, '{}'),
  (insp, 'Cooling System Inspection', 'Cooling fan operation', 'na', NULL, 33, '{}'),
  (insp, 'Cooling System Inspection', 'Overflow / expansion tank', 'na', NULL, 34, '{}'),
  (insp, 'Cooling System Inspection', 'Coolant pH and freeze point', 'na', NULL, 35, '{}'),

  -- Engine Inspection
  (insp, 'Engine Inspection', 'Engine oil level and condition', 'fail', 'Low and dirty', 36, '{}'),
  (insp, 'Engine Inspection', 'Oil leaks (valve cover, oil pan, rear main)', 'na', NULL, 37, '{}'),
  (insp, 'Engine Inspection', 'Coolant level and condition', 'pass', NULL, 38, '{}'),
  (insp, 'Engine Inspection', 'Coolant leaks (radiator, hoses, water pump)', 'na', NULL, 39, '{}'),
  (insp, 'Engine Inspection', 'Serpentine belt condition', 'fail', 'Felt stretched and cracked; pulleys rusted', 40, '{}'),
  (insp, 'Engine Inspection', 'Timing belt or chain noise', 'na', NULL, 41, '{}'),
  (insp, 'Engine Inspection', 'Engine and transmission mounts', 'na', NULL, 42, '{}'),
  (insp, 'Engine Inspection', 'Vacuum hoses and intake boots', 'na', NULL, 43, '{}'),
  (insp, 'Engine Inspection', 'Spark plug condition', 'na', NULL, 44, '{}'),
  (insp, 'Engine Inspection', 'Ignition coils and wires', 'na', NULL, 45, '{}'),
  (insp, 'Engine Inspection', 'Engine air filter', 'fail', 'Dirty', 46, '{}'),
  (insp, 'Engine Inspection', 'PCV valve and breather', 'na', NULL, 47, '{}'),
  (insp, 'Engine Inspection', 'Engine ground straps', 'na', NULL, 48, '{}'),
  (insp, 'Engine Inspection', 'Diagnostic trouble code scan', 'na', NULL, 49, '{}'),
  (insp, 'Engine Inspection', 'Exhaust manifold and gasket leaks', 'na', NULL, 50, '{}'),

  -- Oil Change Inspection
  (insp, 'Oil Change Inspection', 'Engine oil leaks', 'na', NULL, 51, '{}'),
  (insp, 'Oil Change Inspection', 'Coolant level and condition', 'pass', NULL, 52, '{}'),
  (insp, 'Oil Change Inspection', 'Brake fluid level', 'pass', NULL, 53, '{}'),
  (insp, 'Oil Change Inspection', 'Power steering fluid', 'pass', NULL, 54, '{}'),
  (insp, 'Oil Change Inspection', 'Air filter', 'fail', 'Dirty', 55, '{}'),
  (insp, 'Oil Change Inspection', 'Cabin air filter', 'na', NULL, 56, '{}'),
  (insp, 'Oil Change Inspection', 'Serpentine belt', 'fail', 'Felt stretched and cracked; pulleys rusted', 57, '{}'),
  (insp, 'Oil Change Inspection', 'Radiator hoses', 'na', NULL, 58, '{}'),
  (insp, 'Oil Change Inspection', 'CV axle boots', 'na', NULL, 59, '{}'),
  (insp, 'Oil Change Inspection', 'Exhaust system', 'na', NULL, 60, '{}'),
  (insp, 'Oil Change Inspection', 'Motor mounts', 'na', NULL, 61, '{}'),
  (insp, 'Oil Change Inspection', 'Tire tread and pressure', 'fail', 'Tread: LF/RF at wear indicators, LR/RR need replacement soon. Pressure OK.', 62, '{}'),
  (insp, 'Oil Change Inspection', 'Wiper blades', 'na', NULL, 63, '{}'),

  -- Steering & Suspension Inspection
  (insp, 'Steering & Suspension Inspection', 'Upper ball joints', 'na', NULL, 64, '{}'),
  (insp, 'Steering & Suspension Inspection', 'Lower ball joints', 'na', NULL, 65, '{}'),
  (insp, 'Steering & Suspension Inspection', 'Inner tie rod ends', 'na', NULL, 66, '{}'),
  (insp, 'Steering & Suspension Inspection', 'Outer tie rod ends', 'na', NULL, 67, '{}'),
  (insp, 'Steering & Suspension Inspection', 'Control arm bushings', 'na', NULL, 68, '{}'),
  (insp, 'Steering & Suspension Inspection', 'Front struts / shocks', 'na', NULL, 69, '{}'),
  (insp, 'Steering & Suspension Inspection', 'Rear shocks / struts', 'na', NULL, 70, '{}'),
  (insp, 'Steering & Suspension Inspection', 'Sway bar links', 'na', NULL, 71, '{}'),
  (insp, 'Steering & Suspension Inspection', 'Sway bar bushings', 'na', NULL, 72, '{}'),
  (insp, 'Steering & Suspension Inspection', 'Front wheel bearings', 'na', NULL, 73, '{}'),
  (insp, 'Steering & Suspension Inspection', 'CV axles / boots', 'na', NULL, 74, '{}'),
  (insp, 'Steering & Suspension Inspection', 'Steering rack / gearbox', 'na', NULL, 75, '{}'),
  (insp, 'Steering & Suspension Inspection', 'Power steering fluid', 'pass', NULL, 76, '{}'),
  (insp, 'Steering & Suspension Inspection', 'Tire wear pattern', 'fail', 'LF/RF at wear indicators; LR/RR need replacement soon', 77, '{}'),
  (insp, 'Steering & Suspension Inspection', 'Alignment check recommended', 'warning', 'Recommend alignment with new tires', 78, '{}'),

  -- Tires & Alignment Inspection
  (insp, 'Tires & Alignment Inspection', 'Tread depth all 4', 'fail', 'LF/RF at wear indicators; LR/RR need replacement soon', 79, '{}'),
  (insp, 'Tires & Alignment Inspection', 'Sidewall damage', 'na', NULL, 80, '{}'),
  (insp, 'Tires & Alignment Inspection', 'Ball joints', 'na', NULL, 81, '{}'),
  (insp, 'Tires & Alignment Inspection', 'Tie rod ends (inner/outer)', 'na', NULL, 82, '{}'),
  (insp, 'Tires & Alignment Inspection', 'Control arms and bushings', 'na', NULL, 83, '{}'),
  (insp, 'Tires & Alignment Inspection', 'Sway bar links', 'na', NULL, 84, '{}'),
  (insp, 'Tires & Alignment Inspection', 'Wheel bearings', 'na', NULL, 85, '{}'),
  (insp, 'Tires & Alignment Inspection', 'Steering rack boots', 'na', NULL, 86, '{}'),
  (insp, 'Tires & Alignment Inspection', 'Strut bearing plates', 'na', NULL, 87, '{}'),
  (insp, 'Tires & Alignment Inspection', 'Alignment wear indicators', 'warning', 'Tires worn unevenly; alignment recommended', 88, '{}'),

  -- Transmission Service Inspection
  (insp, 'Transmission Service Inspection', 'Transmission mounts', 'na', NULL, 89, '{}'),
  (insp, 'Transmission Service Inspection', 'Engine mounts', 'na', NULL, 90, '{}'),
  (insp, 'Transmission Service Inspection', 'CV axles and boots', 'na', NULL, 91, '{}'),
  (insp, 'Transmission Service Inspection', 'Driveshaft U-joints', 'na', NULL, 92, '{}'),
  (insp, 'Transmission Service Inspection', 'Transfer case fluid', 'na', NULL, 93, '{}'),
  (insp, 'Transmission Service Inspection', 'Differential seals', 'na', NULL, 94, '{}'),
  (insp, 'Transmission Service Inspection', 'Transmission cooler lines', 'na', NULL, 95, '{}'),
  (insp, 'Transmission Service Inspection', 'Pan / case leaks', 'na', NULL, 96, '{}');

  UPDATE public.inspections
  SET summary_notes = 'Immediate attention: engine oil low and dirty; engine/cabin air filter dirty; serpentine belt stretched/cracked with rusted pulleys; front brake pads low and front rotors rusted; LF/RF tires at wear indicators (replace now). Soon: LR/RR tires (replace soon); rear brakes (drum/shoe) inspection; brake lines aged. Alignment recommended with new tires. Lights and fluids (coolant, brake, power steering) checked OK. Battery terminals OK.',
      updated_at = now()
  WHERE id = insp;
END $$;
