const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(process.env.APPDATA, 'desktop-shami-cctv', 'ShamiComputerData', 'shami_pos.db');

if (!fs.existsSync(dbPath)) {
  console.error('Database not found at:', dbPath);
  process.exit(1);
}

// Product definitions mapped to category name / subcategory name
const productsToAdd = [
  // --- Cables (Cat 29) ---
  { cat: 29, subName: 'HDMI Cable 1.5m', name: 'HDMI Cable 1.5 Meter High Speed', purchase: 150, sell: 250, stock: 45, unit: 'pcs', desc: '1080p Full HD Male to Male Cable' },
  { cat: 29, subName: 'HDMI Cable 2m', name: 'HDMI Cable 2 Meter 1080p', purchase: 180, sell: 300, stock: 35, unit: 'pcs', desc: 'Standard 2 Meter HDMI Cable' },
  { cat: 29, subName: 'HDMI Cable 3m', name: 'HDMI Cable 3 Meter 1080p/2K', purchase: 220, sell: 350, stock: 30, unit: 'pcs', desc: '3M Gold-plated HDMI Cable' },
  { cat: 29, subName: 'HDMI Cable 5m', name: 'HDMI Cable 5 Meter Heavy Duty', purchase: 350, sell: 550, stock: 25, unit: 'pcs', desc: '5 Meter Screen Display Cable' },
  { cat: 29, subName: 'HDMI Cable 10m', name: 'HDMI Cable 10 Meter with Filter', purchase: 700, sell: 1100, stock: 20, unit: 'pcs', desc: '10 Meter Long Distance HDMI Cable' },
  { cat: 29, subName: 'HDMI Cable 15m', name: 'HDMI Cable 15 Meter Heavy Shielded', purchase: 1100, sell: 1650, stock: 15, unit: 'pcs', desc: '15 Meter Projector & LED Display Cable' },
  { cat: 29, subName: 'HDMI Cable 20m', name: 'HDMI Cable 20 Meter with Booster', purchase: 1500, sell: 2200, stock: 10, unit: 'pcs', desc: '20 Meter Signal Protected HDMI Cable' },
  { cat: 29, subName: 'HDMI Cable Branded 1.5m', name: 'HDMI Cable Branded 1.5M Original', purchase: 280, sell: 450, stock: 40, unit: 'pcs', desc: 'Original Branded Copper Core Cable' },
  { cat: 29, subName: 'HDMI Cable Branded 2m', name: 'HDMI Cable Branded 2M Original', purchase: 350, sell: 550, stock: 30, unit: 'pcs', desc: 'Imported Original High Quality Cable' },
  { cat: 29, subName: 'DHDMI Cable Branded 1.5m', name: 'DisplayPort to HDMI Cable 1.5M Branded', purchase: 450, sell: 700, stock: 25, unit: 'pcs', desc: 'DP to HDMI Male to Male Adapter Cable' },
  { cat: 29, subName: 'DHDMI Cable Branded 2m', name: 'DisplayPort to HDMI Cable 2M Branded', purchase: 550, sell: 850, stock: 20, unit: 'pcs', desc: 'DisplayPort to HDMI Converter Lead' },
  { cat: 29, subName: 'HDMI Cable 4K 3m', name: 'HDMI Cable 4K 60Hz 3 Meter Braided', purchase: 450, sell: 700, stock: 25, unit: 'pcs', desc: 'Ultra HD 4K 60Hz Nylon Braided' },
  { cat: 29, subName: 'HDMI Cable 4k 5m', name: 'HDMI Cable 4K 60Hz 5 Meter Braided', purchase: 600, sell: 950, stock: 20, unit: 'pcs', desc: 'Ultra HD 4K HDR High Speed 5M' },
  { cat: 29, subName: 'HDMI Cable 4k 10m', name: 'HDMI Cable 4K 10 Meter Braided Core', purchase: 1100, sell: 1700, stock: 15, unit: 'pcs', desc: '4K Ultra HD 10 Meter Projector Wire' },
  { cat: 29, subName: 'HDMI Cable 4k 15m', name: 'HDMI Cable 4K 15 Meter Active Wire', purchase: 1600, sell: 2400, stock: 10, unit: 'pcs', desc: '4K 15 Meter Heavy Gauge Core' },
  { cat: 29, subName: 'HDMI Cable 4k 20m', name: 'HDMI Cable 4K 20 Meter Active Chip', purchase: 2200, sell: 3200, stock: 8, unit: 'pcs', desc: '4K 20 Meter Fibre/Coaxial Supported' },
  { cat: 29, subName: 'HDMI TO VGA Cable 1.5m', name: 'HDMI to VGA Cable 1.5M with Audio Chip', purchase: 350, sell: 550, stock: 30, unit: 'pcs', desc: 'Active HDMI to VGA Output Converter Cable' },
  { cat: 29, subName: 'VGA Cable 1.5m', name: 'VGA Cable 1.5 Meter Standard', purchase: 140, sell: 220, stock: 50, unit: 'pcs', desc: '15-Pin Male to Male Monitor Cable' },
  { cat: 29, subName: 'VGA Cable 2m', name: 'VGA Cable 2 Meter Double Magnetic Ring', purchase: 180, sell: 280, stock: 40, unit: 'pcs', desc: '2 Meter RGB Monitor Lead' },
  { cat: 29, subName: 'VGA Cable 3m', name: 'VGA Cable 3 Meter Filtered', purchase: 240, sell: 380, stock: 30, unit: 'pcs', desc: '3 Meter VGA Display Lead' },
  { cat: 29, subName: 'VGA Cable 5m', name: 'VGA Cable 5 Meter Heavy Gauge', purchase: 350, sell: 550, stock: 25, unit: 'pcs', desc: '5 Meter Male to Male Projector Cable' },
  { cat: 29, subName: 'VGA Cable 10m', name: 'VGA Cable 10 Meter Magnetic Loop', purchase: 650, sell: 1000, stock: 20, unit: 'pcs', desc: '10 Meter Long Distance VGA Cable' },
  { cat: 29, subName: 'VGA Cable 15m', name: 'VGA Cable 15 Meter Shielded', purchase: 950, sell: 1450, stock: 12, unit: 'pcs', desc: '15 Meter High Quality VGA Lead' },
  { cat: 29, subName: 'VGA Cable 20m', name: 'VGA Cable 20 Meter Shielded Heavy', purchase: 1300, sell: 1950, stock: 10, unit: 'pcs', desc: '20 Meter Commercial Display VGA Cable' },
  { cat: 29, subName: 'VGA Cable China', name: 'VGA Cable China Grade 1.5M', purchase: 110, sell: 180, stock: 40, unit: 'pcs', desc: 'China Made Budget VGA Cable' },
  { cat: 29, subName: 'VGA Cable Branded', name: 'VGA Cable Branded Original Heavy Loop', purchase: 250, sell: 400, stock: 35, unit: 'pcs', desc: 'Original Branded Thick Pure Copper' },
  { cat: 29, subName: 'USB Extension 1.5m', name: 'USB Extension Cable 1.5 Meter AM/AF', purchase: 120, sell: 200, stock: 45, unit: 'pcs', desc: 'USB 2.0 Male to Female Extension' },
  { cat: 29, subName: 'USB Extension 3m', name: 'USB Extension Cable 3 Meter AM/AF', purchase: 180, sell: 300, stock: 35, unit: 'pcs', desc: 'USB 2.0 3 Meter Extension Cord' },
  { cat: 29, subName: 'USB Extension 5m', name: 'USB Extension Cable 5 Meter with IC', purchase: 320, sell: 500, stock: 25, unit: 'pcs', desc: '5 Meter USB Signal Extension Lead' },
  { cat: 29, subName: 'USB Extension 10m', name: 'USB Extension Cable 10 Meter Active Repeater', purchase: 750, sell: 1200, stock: 15, unit: 'pcs', desc: '10 Meter Active Amplified USB Cable' },
  { cat: 29, subName: 'Power Cable (Branded)', name: 'Power Cable Branded Heavy Pure Copper', purchase: 180, sell: 300, stock: 60, unit: 'pcs', desc: 'Heavy Duty 3-Pin Desktop/Monitor Power Cord' },
  { cat: 29, subName: 'Power Cable (China)', name: 'Power Cable China Standard', purchase: 90, sell: 160, stock: 50, unit: 'pcs', desc: 'Standard 3-Pin Computer Power Cable' },
  { cat: 29, subName: 'Butterfly Cable Branded', name: 'Butterfly Cable Branded (Figure 8 / 2-Pin)', purchase: 130, sell: 220, stock: 30, unit: 'pcs', desc: 'Laptop Charger / Radio Power Cable' },
  { cat: 29, subName: 'Butterfly Cable China', name: 'Butterfly Cable China 2-Pin', purchase: 70, sell: 130, stock: 35, unit: 'pcs', desc: 'Standard 2-Pin Butterfly Power Cord' },
  { cat: 29, subName: 'VCR Cable Branded', name: '3-RCA to 3-RCA AV Cable Branded', purchase: 120, sell: 220, stock: 25, unit: 'pcs', desc: 'Audio Video Composite Cable for TV/DVR' },
  { cat: 29, subName: 'Printer Cable 1m', name: 'USB Printer Cable 1 Meter Type A to B', purchase: 110, sell: 190, stock: 30, unit: 'pcs', desc: 'USB 2.0 A Male to B Male' },
  { cat: 29, subName: 'Printer Cable 1.5m', name: 'USB Printer Cable 1.5 Meter Shielded', purchase: 140, sell: 240, stock: 40, unit: 'pcs', desc: 'Standard 1.5M Printer Data Cable' },
  { cat: 29, subName: 'Printer Cable 5m', name: 'USB Printer Cable 5 Meter with Magnet', purchase: 320, sell: 500, stock: 20, unit: 'pcs', desc: '5 Meter Long USB Printer Connection Lead' },

  // --- Keyboards (Cat 20) ---
  { cat: 20, subName: 'Keyboard Branded', name: 'DELL / HP Branded USB Keyboard Used Original', purchase: 450, sell: 700, stock: 30, unit: 'pcs', desc: 'Original Branded Heavy Duty Typing Keyboard' },
  { cat: 20, subName: 'R8 1916 Keyboard Wireless', name: 'R8 1916 Wireless Keyboard & Mouse Combo', purchase: 1400, sell: 2100, stock: 15, unit: 'pcs', desc: '2.4GHz Slim Wireless Desktop Set' },
  { cat: 20, subName: 'HP CS 700 Keyboard + Mouse Wireless', name: 'HP CS-700 Wireless Keyboard and Mouse Set', purchase: 1650, sell: 2450, stock: 12, unit: 'pcs', desc: 'Original HP Wireless Combo Set' },
  { cat: 20, subName: 'HY 1001 Keyboard + Mouse wired', name: 'HY-1001 Wired Keyboard & Mouse Combo', purchase: 750, sell: 1150, stock: 25, unit: 'pcs', desc: 'Reliable Office Desktop Combo' },
  { cat: 20, subName: 'MR 404 Keyboard  + Mouse Wireless', name: 'MR-404 Wireless Keyboard and Optical Mouse', purchase: 1350, sell: 1950, stock: 15, unit: 'pcs', desc: 'Ergonomic 2.4G Wireless Desk Kit' },
  { cat: 20, subName: 'Mini Keyboard + Mouse Wirless', name: 'Mini Wireless Keyboard with Touchpad (Backlit)', purchase: 850, sell: 1350, stock: 20, unit: 'pcs', desc: 'Rechargeable Smart TV / PC Handheld Controller' },
  { cat: 20, subName: 'logitech K 400+ Bluetooth', name: 'Logitech K400+ Wireless Touch Keyboard Original', purchase: 3800, sell: 4900, stock: 8, unit: 'pcs', desc: 'Built-in Touchpad for TV Connected PC' },
  { cat: 20, subName: 'G 302 Keyboard Gaming Wired', name: 'G-302 RGB Gaming Keyboard Mechanical Feel', purchase: 1100, sell: 1700, stock: 18, unit: 'pcs', desc: 'Backlit Multimedia Gaming Keyboard' },
  { cat: 20, subName: 'LM 2104 Keyboard Wired', name: 'LM-2104 Office USB Keyboard', purchase: 500, sell: 750, stock: 30, unit: 'pcs', desc: 'Waterproof Membrane Keypad' },
  { cat: 20, subName: 'FEELLOVE Keyboard Wired', name: 'FeeLove USB Standard Desktop Keyboard', purchase: 480, sell: 700, stock: 25, unit: 'pcs', desc: 'Smooth Silent Touch Office Keyboard' },

  // --- Mouse (Cat 21) ---
  { cat: 21, subName: 'Mouse Branded', name: 'DELL / Lenovo Branded Optical USB Mouse Original', purchase: 220, sell: 350, stock: 60, unit: 'pcs', desc: 'Durable Optical Office Mouse' },
  { cat: 21, subName: 'G 601 Mouse Gaming Wired', name: 'G-601 7D RGB Gaming Mouse 3200 DPI', purchase: 450, sell: 700, stock: 25, unit: 'pcs', desc: 'High Precision Gaming Sensor Mouse' },
  { cat: 21, subName: 'Speed G 8 Mouse Gaming Wired', name: 'Speed G-8 Programmable RGB Gaming Mouse', purchase: 520, sell: 800, stock: 20, unit: 'pcs', desc: 'Braided Wire with DPI Adjustment' },
  { cat: 21, subName: 'S 288 Gaming Mouse Wired', name: 'S-288 Macro Gaming Optical Mouse', purchase: 420, sell: 650, stock: 20, unit: 'pcs', desc: 'Colorful Breathing LED Gaming Mouse' },
  { cat: 21, subName: 'Logitech G 102 Gaming Mouse Wired', name: 'Logitech G102 Lightsync RGB Gaming Mouse', purchase: 2400, sell: 3200, stock: 10, unit: 'pcs', desc: '8000 DPI Hero Grade Gaming Sensor' },
  { cat: 21, subName: 'A4Tech Mouse Wireless', name: 'A4Tech G3-200N Wireless Mouse Original', purchase: 1100, sell: 1600, stock: 15, unit: 'pcs', desc: 'V-Track Energy Saving Wireless Optical' },
  { cat: 21, subName: 'GM 31 Mouse Gaming Wired', name: 'GM-31 RGB High Speed Gaming Mouse', purchase: 400, sell: 650, stock: 20, unit: 'pcs', desc: 'Comfortable Grip with 4 DPI Levels' },
  { cat: 21, subName: 'CW 902 Mouse Gaming  wired', name: 'ONIKUMA CW902 RGB Gaming Mouse', purchase: 850, sell: 1350, stock: 12, unit: 'pcs', desc: '6400 DPI Custom RGB Gaming Optical Mouse' },
  { cat: 21, subName: 'M 100 HP Gaming Mouse Wired', name: 'HP M100 High-End RGB Gaming Mouse', purchase: 650, sell: 950, stock: 22, unit: 'pcs', desc: 'Original HP Entry Level Gaming Mouse' },
  { cat: 21, subName: 'GM 33 Gaming Mouse wired', name: 'GM-33 Ergonomic Gaming Mouse 3200 DPI', purchase: 440, sell: 700, stock: 18, unit: 'pcs', desc: 'Heavy Metal Base Plate Gaming Mouse' },
  { cat: 21, subName: 'AMG 1 Mouse Gaming Wired', name: 'AMG-1 Silent Click Gaming Mouse', purchase: 480, sell: 750, stock: 20, unit: 'pcs', desc: 'RGB Lighting with Mute Switch' },
  { cat: 21, subName: 'Gaming Mouse wirelss', name: 'Rechargeable Wireless Gaming Mouse RGB', purchase: 750, sell: 1200, stock: 18, unit: 'pcs', desc: 'Internal Lithium Battery 2.4G Wireless' },
  { cat: 21, subName: 'Victing Wireless Mouse', name: 'VictSing 2.4G Slim Wireless Mouse', purchase: 600, sell: 950, stock: 25, unit: 'pcs', desc: 'Silent Click Portable Laptop Mouse' },
  { cat: 21, subName: 'Q 601 AIGO Mouse Wirless', name: 'AIGO Q-601 Compact Wireless Mouse', purchase: 520, sell: 800, stock: 20, unit: 'pcs', desc: '1600 DPI Energy Saving Nano Receiver' },
  { cat: 21, subName: 'M 066 WD Mouse Wired', name: 'WD M-066 Optical USB Mouse', purchase: 180, sell: 300, stock: 40, unit: 'pcs', desc: 'Budget Standard Optical Mouse' },
  { cat: 21, subName: 'DELL MS 116 Mouse Wired', name: 'DELL MS116 Optical USB Mouse Original', purchase: 320, sell: 500, stock: 35, unit: 'pcs', desc: 'Reliable Everyday Office Mouse' },
  { cat: 21, subName: 'M 160 Mouse Gaming Wired', name: 'HP M160 RGB Wired Gaming Mouse', purchase: 480, sell: 750, stock: 25, unit: 'pcs', desc: 'Entry Level HP Gaming Sensor' },
  { cat: 21, subName: 'M 110 Mouse Wireless', name: 'M-110 Portable 2.4G Wireless Mouse', purchase: 450, sell: 700, stock: 30, unit: 'pcs', desc: 'Pocket Wireless Mouse for Laptops' },

  // --- Converters & Hubs (Cat 34) ---
  { cat: 34, subName: 'DP TO VGA  Master', name: 'DisplayPort to VGA Adapter Master Original', purchase: 380, sell: 600, stock: 25, unit: 'pcs', desc: 'DP Male to VGA Female Converter Dongle' },
  { cat: 34, subName: 'VGA TO HDMI Converter Master', name: 'VGA to HDMI Converter with Audio USB Power', purchase: 650, sell: 1050, stock: 20, unit: 'pcs', desc: 'Converts Old PC VGA Output to HDMI TV' },
  { cat: 34, subName: 'C Type TO VGA', name: 'USB Type-C to VGA Converter Adapter', purchase: 550, sell: 900, stock: 15, unit: 'pcs', desc: 'MacBook & Type-C Phone/Laptop to VGA Screen' },
  { cat: 34, subName: '7 Port USB Hub', name: '7-Port USB 2.0 Hub with Individual Power Switches', purchase: 450, sell: 750, stock: 25, unit: 'pcs', desc: 'Multi-port Extension with LED Indicators' },
  { cat: 34, subName: '4 Port USB HUB', name: '4-Port High Speed USB 3.0/2.0 Hub', purchase: 300, sell: 500, stock: 30, unit: 'pcs', desc: 'Compact 4 Port Laptop Extender' },
  { cat: 34, subName: '3 Port USB HUB', name: '3-Port USB Mini Rotatable Hub', purchase: 220, sell: 380, stock: 25, unit: 'pcs', desc: '180 Degree Swivel USB Splitter' },
  { cat: 34, subName: 'USB TO SATA', name: 'USB 3.0 to SATA 2.5 Inch Hard Drive Converter Cable', purchase: 650, sell: 1050, stock: 20, unit: 'pcs', desc: 'Fast Data Transfer Adapter for SSD/HDD' },

  // --- Hard Disk & SSD (Cat 26) ---
  { cat: 26, subName: '120 GB laptop', name: '128 GB 2.5 SATA SSD High Speed', purchase: 1800, sell: 2500, stock: 15, unit: 'pcs', desc: 'Brand New Solid State Drive 550MB/s' },
  { cat: 26, subName: '250 GB Laptop', name: '256 GB 2.5 SATA SSD / 250GB HDD', purchase: 2200, sell: 3100, stock: 12, unit: 'pcs', desc: 'High Performance Laptop Internal Drive' },
  { cat: 26, subName: '320 GB laptop', name: '320 GB 2.5 Inch Laptop Hard Disk Drive (SATA)', purchase: 1100, sell: 1700, stock: 10, unit: 'pcs', desc: '100% Health Tested 5400RPM Drive' },
  { cat: 26, subName: '500 GB HDD System', name: '500 GB 3.5 Inch Desktop System Hard Disk Drive', purchase: 1400, sell: 2100, stock: 15, unit: 'pcs', desc: '7200RPM Seagate/WD Desktop Storage Drive' },

  // --- Hard Case (Cat 42) ---
  { cat: 42, subName: '2.5 HDD/SSD External Case', name: '2.5 Inch External Hard Drive Enclosure USB 3.0', purchase: 450, sell: 750, stock: 25, unit: 'pcs', desc: 'Tool-Free Clear/Black External HDD Enclosure' },
  { cat: 42, subName: '2.5 Inch SATA Case', name: '2.5 Inch SATA to USB External Case Metal Body', purchase: 520, sell: 850, stock: 20, unit: 'pcs', desc: 'Shockproof Aluminum Hard Drive Caddy' },
  { cat: 42, subName: 'WD 2.0 HDD Case', name: 'WD Elements 2.5 Inch USB 2.0 Casing', purchase: 350, sell: 600, stock: 25, unit: 'pcs', desc: 'Portable Hard Disk Protective Casing' },
  { cat: 42, subName: 'WD 3.0 Hard Case', name: 'Western Digital USB 3.0 2.5 Inch External Casing', purchase: 580, sell: 950, stock: 20, unit: 'pcs', desc: 'High Speed 5Gbps USB 3.0 Enclosure' },

  // --- Mouse Pad & Covers (Cat 38) ---
  { cat: 38, subName: 'Mouse Pad G7 Logitech', name: 'Logitech G7 Large Gaming Mouse Pad (Stitched)', purchase: 200, sell: 350, stock: 40, unit: 'pcs', desc: 'Non-slip Rubber Base Gaming Surface' },
  { cat: 38, subName: 'Mouse Pad Simple', name: 'Standard Smooth Cloth Mouse Pad', purchase: 50, sell: 100, stock: 60, unit: 'pcs', desc: 'Everyday Durable Mouse Mat' },
  { cat: 38, subName: 'KeyPad Cover 15 inch', name: 'Silicone Laptop Keyboard Protector Skin 15.6 Inch', purchase: 80, sell: 160, stock: 40, unit: 'pcs', desc: 'Universal Waterproof Dust Protector Cover' },
  { cat: 38, subName: 'KeyPad Cover 13 inch', name: 'Silicone Laptop Keyboard Protector Skin 14/13 Inch', purchase: 70, sell: 150, stock: 35, unit: 'pcs', desc: 'Universal Clean Clear Keypad Skin' },

  // --- CCTV Camera (Cat 24) ---
  { cat: 24, subName: null, name: 'Dahua 2MP HDCVI IR Bullet Camera 1080p', purchase: 2400, sell: 3200, stock: 15, unit: 'pcs', desc: 'Outdoor Night Vision CCTV Camera' },
  { cat: 24, subName: null, name: 'Hikvision 2MP Turbo HD Dome Camera Indoor', purchase: 2300, sell: 3100, stock: 18, unit: 'pcs', desc: 'Indoor Night Vision Wide Angle CCTV' },
  { cat: 24, subName: null, name: 'Wi-Fi PTZ 360 Smart Rotating Camera Outdoor', purchase: 3800, sell: 5200, stock: 10, unit: 'pcs', desc: 'Two-Way Audio Mobile App Live View' },

  // --- DVR / NVR (Cat 25) ---
  { cat: 25, subName: null, name: 'Dahua 4-Channel 1080p XVR / DVR Recorder', purchase: 4800, sell: 6500, stock: 8, unit: 'pcs', desc: 'H.265+ 4CH Video Recorder with Cloud Access' },
  { cat: 25, subName: null, name: 'Dahua 8-Channel 1080p XVR / DVR Recorder', purchase: 6800, sell: 8900, stock: 6, unit: 'pcs', desc: 'H.265+ 8CH System with Remote Phone App' },

  // --- RAM (Cat 28) ---
  { cat: 28, subName: null, name: '4 GB DDR3 1333/1600 Desktop RAM Original', purchase: 900, sell: 1400, stock: 25, unit: 'pcs', desc: 'Tested 100% Original Desktop Memory' },
  { cat: 28, subName: null, name: '8 GB DDR3 1600 Desktop RAM Original', purchase: 1800, sell: 2600, stock: 20, unit: 'pcs', desc: 'High Speed 8GB Desktop Memory' },
  { cat: 28, subName: null, name: '4 GB DDR4 2400/2666 Desktop RAM', purchase: 1600, sell: 2300, stock: 15, unit: 'pcs', desc: 'DDR4 Gaming/Office Desktop Memory' },
  { cat: 28, subName: null, name: '8 GB DDR4 2666/3200 Desktop RAM', purchase: 2800, sell: 3900, stock: 18, unit: 'pcs', desc: 'Samsung/Hynix DDR4 8GB Memory' },

  // --- Power Supply (Cat 30) ---
  { cat: 30, subName: null, name: 'Gaming Power Supply 500W 80 Plus Bronze', purchase: 3200, sell: 4600, stock: 10, unit: 'pcs', desc: 'With 6+2 Pin PCIe GPU Connectors' },
  { cat: 30, subName: null, name: 'Desktop Standard Power Supply 250W/300W Used', purchase: 700, sell: 1150, stock: 25, unit: 'pcs', desc: 'Original Branded Desktop Replacement PSU' },

  // --- WiFi Modems & Adapters (Cat 36 & 37) ---
  { cat: 36, subName: null, name: 'TP-Link TL-WR840N 300Mbps Wireless Router', purchase: 3200, sell: 4200, stock: 10, unit: 'pcs', desc: 'High Gain Dual Antenna WiFi Router' },
  { cat: 37, subName: null, name: 'Alfa High Gain USB WiFi Adapter with Antenna', purchase: 450, sell: 750, stock: 35, unit: 'pcs', desc: '150M/300M Long Distance USB WiFi Dongle' },

  // --- USB Flash Drives (Cat 41) ---
  { cat: 41, subName: null, name: 'Kingston 32 GB USB 3.0 Flash Drive Metal', purchase: 850, sell: 1250, stock: 30, unit: 'pcs', desc: 'Compact Metal Waterproof USB Stick' },
  { cat: 41, subName: null, name: 'Kingston 64 GB USB 3.0 Flash Drive Metal', purchase: 1150, sell: 1650, stock: 25, unit: 'pcs', desc: 'High Capacity 64GB USB Memory Stick' },

  // --- HeadPhones (Cat 39) ---
  { cat: 39, subName: null, name: 'Gaming Headphone with Mic & LED RGB', purchase: 1200, sell: 1850, stock: 15, unit: 'pcs', desc: 'Deep Bass Noise Cancelling Gaming Headset' },
  { cat: 39, subName: null, name: 'A4Tech Comfort Headphone with Boom Mic', purchase: 1100, sell: 1650, stock: 12, unit: 'pcs', desc: 'Clear Voice Calls for Call Center / Zoom' },

  // --- Speakers (Cat 33) ---
  { cat: 33, subName: null, name: 'USB 2.0 Multimedia Stereo Speakers Mini', purchase: 450, sell: 750, stock: 20, unit: 'pcs', desc: 'Powered by USB with 3.5mm Jack for PC/Laptop' },

  // --- Gaming Controllers (Cat 40) ---
  { cat: 40, subName: null, name: 'USB Dual Shock Gamepad Controller for PC', purchase: 450, sell: 750, stock: 25, unit: 'pcs', desc: 'Plug and Play USB Gaming Joystick' },
  { cat: 40, subName: null, name: 'Wireless Game Controller for PC / PS3', purchase: 1250, sell: 1950, stock: 12, unit: 'pcs', desc: 'Rechargeable 2.4G Wireless Gamepad' }
];

async function seed() {
  const SQL = await initSqlJs();
  const fileBuffer = fs.readFileSync(dbPath);
  const db = new SQL.Database(fileBuffer);

  // Fetch all subcategories
  const subcatRows = db.exec('SELECT id, category_id, name FROM subcategories');
  const subcatMap = new Map();
  if (subcatRows.length > 0) {
    subcatRows[0].values.forEach(([id, catId, name]) => {
      subcatMap.set(`${catId}_${name.trim().toLowerCase()}`, id);
    });
  }

  // Fetch existing product names/SKUs to prevent duplicate entries
  const existingRows = db.exec('SELECT name, sku FROM products');
  const existingNames = new Set();
  if (existingRows.length > 0) {
    existingRows[0].values.forEach(([name, sku]) => {
      existingNames.add(name.trim().toLowerCase());
    });
  }

  console.log(`Found ${existingNames.size} existing products.`);

  let inserted = 0;
  let skuCounter = 10100;

  for (const item of productsToAdd) {
    // Check if name already exists
    if (existingNames.has(item.name.trim().toLowerCase())) {
      console.log(`Skipping already existing: ${item.name}`);
      continue;
    }

    // Match subcategory id
    let subcatId = null;
    if (item.subName) {
      const key = `${item.cat}_${item.subName.trim().toLowerCase()}`;
      if (subcatMap.has(key)) {
        subcatId = subcatMap.get(key);
      } else {
        // Partial search
        for (const [k, id] of subcatMap.entries()) {
          if (k.startsWith(`${item.cat}_`) && (k.includes(item.subName.toLowerCase()) || item.subName.toLowerCase().includes(k.replace(`${item.cat}_`, '')))) {
            subcatId = id;
            break;
          }
        }
      }
    }

    skuCounter += Math.floor(Math.random() * 5) + 1;
    const sku = `PRD-${skuCounter}`;

    try {
      db.prepare(`
        INSERT INTO products (sku, name, category_id, subcategory_id, purchase_price, selling_price, stock_quantity, minimum_stock, unit, description, active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      `).run([sku, item.name, item.cat, subcatId, item.purchase, item.sell, item.stock, 5, item.unit || 'pcs', item.desc || '']);
      
      existingNames.add(item.name.trim().toLowerCase());
      inserted++;
    } catch (err) {
      console.error(`Error inserting ${item.name}:`, err.message);
    }
  }

  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
  console.log(`Successfully added ${inserted} products to the database!`);
}

seed().catch(err => {
  console.error('Fatal seed error:', err);
});
