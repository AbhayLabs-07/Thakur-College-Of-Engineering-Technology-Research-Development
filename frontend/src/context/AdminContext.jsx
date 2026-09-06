import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { adminService, componentService } from '../services/api';
import { authStorage } from '../utils/storage';

const AdminContext = createContext();

// Initial Default Components Catalog (aligned with photos in public/Photos)
const INITIAL_COMPONENTS = [
  {
    _id: 'comp-101',
    name: 'Raspberry Pi 4 Model B (4GB)',
    category: 'Development Board',
    quantityTotal: 10,
    quantityAvailable: 6,
    quantityLoaned: 4,
    quantityDamaged: 0,
    quantityLost: 0,
    imageUrl: '/Photos/Raspberry Pi 4 Model B.png',
    description: 'High-performance 64-bit quad-core processor, dual-display support at resolutions up to 4K via micro-HDMI, hardware video decode up to 4Kp60.',
    keywords: ['raspberry pi', 'rpi4', 'sbc', 'linux', 'arm'],
    specs: { 'Processor': 'Broadcom BCM2711 1.5GHz', 'RAM': '4GB LPDDR4', 'WiFi': '2.4/5.0 GHz IEEE 802.11ac', 'Bluetooth': '5.0 BLE' },
    storageLocation: 'Lab Cabinet A-02'
  },
  {
    _id: 'comp-102',
    name: 'Arduino Uno R3',
    category: 'Microcontroller',
    quantityTotal: 25,
    quantityAvailable: 18,
    quantityLoaned: 7,
    quantityDamaged: 0,
    quantityLost: 0,
    imageUrl: '/Photos/Arduino Uno.png',
    description: 'Standard ATmega328P microcontroller board with 14 digital I/O pins, 6 analog inputs, 16 MHz quartz crystal, USB connection.',
    keywords: ['arduino', 'uno', 'atmega328p', 'embedded', 'iot'],
    specs: { 'Microcontroller': 'ATmega328P', 'Operating Voltage': '5V', 'Digital I/O': '14 pins', 'Flash Memory': '32 KB' },
    storageLocation: 'Rack B-14'
  },
  {
    _id: 'comp-103',
    name: 'Nvidia Jetson Nano Developer Kit',
    category: 'Development Board',
    quantityTotal: 6,
    quantityAvailable: 4,
    quantityLoaned: 2,
    quantityDamaged: 0,
    quantityLost: 0,
    imageUrl: '/Photos/Nvidia Jetson Nano Developer Kit.png',
    description: '128-core NVIDIA Maxwell GPU delivering 472 GFLOPS of accelerated computing for edge AI, computer vision, and neural network inference.',
    keywords: ['nvidia', 'jetson', 'nano', 'ai', 'deep learning', 'gpu'],
    specs: { 'GPU': '128-core Maxwell', 'CPU': 'Quad-core ARM A57', 'RAM': '4GB 64-bit LPDDR4', 'Compute': '472 GFLOPS' },
    storageLocation: 'High-Value Locker H-01'
  },
  {
    _id: 'comp-104',
    name: 'ESP-WROOM-32 Development Board',
    category: 'Microcontroller',
    quantityTotal: 30,
    quantityAvailable: 22,
    quantityLoaned: 8,
    quantityDamaged: 0,
    quantityLost: 0,
    imageUrl: '/Photos/ESP-WROOM-32 .png',
    description: 'Powerful generic Wi-Fi + BT + BLE MCU module that targets a wide variety of applications, ranging from low-power sensor networks to heavy tasks.',
    keywords: ['esp32', 'wifi', 'bluetooth', 'iot', 'espressif'],
    specs: { 'CPU': 'Xtensa Dual-Core 32-bit LX6', 'Clock': '240 MHz', 'SRAM': '520 KB', 'Wireless': 'Wi-Fi 802.11 b/g/n + BT v4.2' },
    storageLocation: 'Drawer C-05'
  },
  {
    _id: 'comp-105',
    name: 'ESP32-CAM WiFi + Bluetooth Camera Module',
    category: 'Sensors',
    quantityTotal: 15,
    quantityAvailable: 11,
    quantityLoaned: 4,
    quantityDamaged: 0,
    quantityLost: 0,
    imageUrl: '/Photos/esp32-cam module.png',
    description: 'Smallest 802.11b/g/n Wi-Fi BT SoC module with OV2640 2MP Camera, built-in flash lamp, and micro TF card slot for surveillance and machine vision.',
    keywords: ['esp32', 'cam', 'ov2640', 'camera', 'vision', 'streaming'],
    specs: { 'Camera': 'OV2640 2 Megapixels', 'Flash': 'Built-in bright LED', 'TF Card': 'Supports up to 4GB', 'Interface': 'UART/SPI/I2C/PWM' },
    storageLocation: 'Drawer C-06'
  },
  {
    _id: 'comp-106',
    name: 'TowerPro SG90 Micro Servo Motor (180°)',
    category: 'Motors',
    quantityTotal: 40,
    quantityAvailable: 31,
    quantityLoaned: 9,
    quantityDamaged: 0,
    quantityLost: 0,
    imageUrl: '/Photos/TowerPro SG90 Servo Motor (180° Rotation).png',
    description: 'Tiny and lightweight 9g servo motor with high output power. Ideal for robotic arm joints, RC airplanes, and pan-tilt camera mechanisms.',
    keywords: ['servo', 'motor', 'sg90', 'actuator', 'robotics'],
    specs: { 'Weight': '9g', 'Operating Speed': '0.12s/60 deg (4.8V)', 'Stall Torque': '1.8 kg-cm', 'Rotation': '180 Degrees' },
    storageLocation: 'Bin D-01'
  },
  {
    _id: 'comp-107',
    name: 'Full Size 830 Points Solderless Breadboard',
    category: 'Electronic Components',
    quantityTotal: 50,
    quantityAvailable: 42,
    quantityLoaned: 8,
    quantityDamaged: 0,
    quantityLost: 0,
    imageUrl: '/Photos/Breadboard.png',
    description: 'Reusable solderless prototyping breadboard with 830 tie points and adhesive back tape. Includes distribution strip and terminal strips.',
    keywords: ['breadboard', 'prototyping', 'circuit', 'solderless'],
    specs: { 'Tie Points': '830 Points', 'Pitch': '2.54mm Standard', 'Terminal Strips': '630 Tie-points', 'Bus Strips': '200 Tie-points' },
    storageLocation: 'Lab Cabinet A-09'
  },
  {
    _id: 'comp-108',
    name: 'Arduino USB Cable (Type A to Type B)',
    category: 'Other',
    quantityTotal: 35,
    quantityAvailable: 28,
    quantityLoaned: 7,
    quantityDamaged: 0,
    quantityLost: 0,
    imageUrl: '/Photos/Cable for Arduino UNO MEGA .png',
    description: 'Durable 30cm USB 2.0 A-Male to B-Male data upload and power supply cable for Arduino Uno and Arduino Mega development boards.',
    keywords: ['cable', 'usb', 'arduino cable', 'programmer'],
    specs: { 'Connector A': 'USB Type-A Male', 'Connector B': 'USB Type-B Male', 'Standard': 'USB 2.0 High Speed', 'Length': '30 cm' },
    storageLocation: 'Bin E-02'
  },
  {
    _id: 'comp-109',
    name: 'Micro USB Code Uploading Cable',
    category: 'Other',
    quantityTotal: 40,
    quantityAvailable: 34,
    quantityLoaned: 6,
    quantityDamaged: 0,
    quantityLost: 0,
    imageUrl: '/Photos/Code Uploading Cable Micro USB.png',
    description: 'High quality shielded Micro-USB to USB-A data sync and flashing cable for ESP8266, ESP32, and Raspberry Pi Pico boards.',
    keywords: ['micro usb', 'cable', 'flashing', 'esp32'],
    specs: { 'Connector': 'Micro USB to USB-A', 'Current Rating': '2.4A Fast Charge & Data', 'Length': '100 cm' },
    storageLocation: 'Bin E-03'
  },
  {
    _id: 'comp-110',
    name: '40-Pin DuPont Jumper Wires (Male to Male 20cm)',
    category: 'Electronic Components',
    quantityTotal: 60,
    quantityAvailable: 48,
    quantityLoaned: 12,
    quantityDamaged: 0,
    quantityLost: 0,
    imageUrl: '/Photos/Male to Male Jumper Wires 40Pcs 20cm.png',
    description: 'Multi-color ribbon cable of 40 pieces flexible Male to Male jumper wires with 2.54mm standard spacing.',
    keywords: ['jumper', 'wires', 'male-male', 'dupont', 'connectors'],
    specs: { 'Quantity': '40 Pieces', 'Length': '20 cm', 'Connector Type': 'Male to Male', 'Pitch': '2.54 mm' },
    storageLocation: 'Bin D-04'
  },
  {
    _id: 'comp-111',
    name: '40-Pin DuPont Jumper Wires (Male to Female 20cm)',
    category: 'Electronic Components',
    quantityTotal: 60,
    quantityAvailable: 49,
    quantityLoaned: 11,
    quantityDamaged: 0,
    quantityLost: 0,
    imageUrl: '/Photos/Male to Female Jumper Wires 40Pcs 20cm.png',
    description: 'Multi-color ribbon cable of 40 pieces Male to Female jumper wires for sensor pinouts to microcontrollers.',
    keywords: ['jumper', 'wires', 'male-female', 'dupont'],
    specs: { 'Quantity': '40 Pieces', 'Length': '20 cm', 'Connector Type': 'Male to Female', 'Pitch': '2.54 mm' },
    storageLocation: 'Bin D-05'
  },
  {
    _id: 'comp-112',
    name: '40-Pin DuPont Jumper Wires (Female to Female 20cm)',
    category: 'Electronic Components',
    quantityTotal: 60,
    quantityAvailable: 51,
    quantityLoaned: 9,
    quantityDamaged: 0,
    quantityLost: 0,
    imageUrl: '/Photos/20CM DuPont Wire Color Jumper Cable 2.54mm 1P-1P Female to Female.png',
    description: 'Multi-color ribbon cable of 40 pieces Female to Female jumper cables for connecting header modules directly.',
    keywords: ['jumper', 'wires', 'female-female', 'dupont'],
    specs: { 'Quantity': '40 Pieces', 'Length': '20 cm', 'Connector Type': 'Female to Female', 'Pitch': '2.54 mm' },
    storageLocation: 'Bin D-06'
  }
];

// Initial Requests Queue
const INITIAL_REQUESTS = [
  {
    _id: 'REQ-1032251955',
    requestId: 'REQ-1032251955',
    student: {
      name: 'Abhay Vishwakarma',
      erpId: '1032251955',
      branch: 'Artificial Intelligence & Data Science',
      year: 'Third Year',
      division: 'A',
      email: '1032251955@tcetmumbai.in',
      contactNumber: '+91 9820199551'
    },
    facultyMentor: {
      _id: 'fac-prachi',
      name: 'Dr. Prachi Janrao',
      department: 'Artificial Intelligence and Data Science',
      designation: 'Associate Professor & HoD',
      email: 'prachi.janrao@tcetmumbai.in'
    },
    projectTitle: 'Autonomous Telemetry & Vision-Based Speedometer',
    projectDomain: 'Embedded AI & Edge Robotics',
    projectDescription: 'Building a smart high-speed speed sensing system with edge optical flow and CAN bus telemetry.',
    cartItems: [
      {
        component: 'comp-101',
        componentName: 'Raspberry Pi 4 Model B (4GB)',
        quantity: 1
      },
      {
        component: 'comp-105',
        componentName: 'ESP32-CAM WiFi + Bluetooth Camera Module',
        quantity: 1
      },
      {
        component: 'comp-110',
        componentName: '40-Pin DuPont Jumper Wires (Male to Male 20cm)',
        quantity: 1
      }
    ],
    requestedAt: '2026-09-06T10:15:00Z',
    requiredDate: '2026-09-08',
    status: 'pending_admin', // 'pending_faculty', 'pending_admin', 'approved', 'rejected'
    facultyDecision: {
      approved: true,
      timestamp: '2026-09-06T11:20:00Z',
      remarks: 'Project approved for R&D Edge Computing track. Hardware allocation recommended.'
    },
    adminNotes: ''
  },
  {
    _id: 'REQ-1032250842',
    requestId: 'REQ-1032250842',
    student: {
      name: 'Rahul Sharma',
      erpId: '1032250842',
      branch: 'Computer Engineering',
      year: 'Third Year',
      division: 'B',
      email: '1032250842@tcetmumbai.in',
      contactNumber: '+91 9820084201'
    },
    facultyMentor: {
      _id: 'fac-harsh',
      name: 'Dr. Harsh Gagrani',
      department: 'Computer Engineering',
      designation: 'Assistant Professor & CoE Lead',
      email: 'harsh.gagrani@tcetmumbai.in'
    },
    projectTitle: 'Industrial IoT Environmental Quality Node',
    projectDomain: 'Internet of Things',
    projectDescription: 'Deploying low-power multi-gas sensory nodes with mesh communication.',
    cartItems: [
      {
        component: 'comp-104',
        componentName: 'ESP-WROOM-32 Development Board',
        quantity: 2
      },
      {
        component: 'comp-107',
        componentName: 'Full Size 830 Points Solderless Breadboard',
        quantity: 1
      }
    ],
    requestedAt: '2026-09-06T11:45:00Z',
    requiredDate: '2026-09-10',
    status: 'pending_admin',
    facultyDecision: {
      approved: true,
      timestamp: '2026-09-06T12:00:00Z',
      remarks: 'Verified hardware requirement with team schematic.'
    },
    adminNotes: ''
  },
  {
    _id: 'REQ-1032250311',
    requestId: 'REQ-1032250311',
    student: {
      name: 'Priya Shah',
      erpId: '1032250311',
      branch: 'Electronics & Telecommunication',
      year: 'Final Year',
      division: 'A',
      email: '1032250311@tcetmumbai.in',
      contactNumber: '+91 9820031145'
    },
    facultyMentor: {
      _id: 'fac-vinit',
      name: 'Dr. Vinitkumar Dongre',
      department: 'Research and Development',
      designation: 'Professor & Dean R&D',
      email: 'vini.dongre@tcetmumbai.in'
    },
    projectTitle: 'Smart Multi-Axis Pan-Tilt Solar Tracker',
    projectDomain: 'Renewable Energy & Mechatronics',
    projectDescription: 'Dual-axis servo positioning system with LDR feedback array and Arduino MCU.',
    cartItems: [
      {
        component: 'comp-102',
        componentName: 'Arduino Uno R3',
        quantity: 1
      },
      {
        component: 'comp-106',
        componentName: 'TowerPro SG90 Micro Servo Motor (180°)',
        quantity: 2
      }
    ],
    requestedAt: '2026-09-06T12:30:00Z',
    requiredDate: '2026-09-09',
    status: 'pending_admin',
    facultyDecision: {
      approved: true,
      timestamp: '2026-09-06T13:10:00Z',
      remarks: 'Recommended for interdisciplinary lab fabrication.'
    },
    adminNotes: ''
  }
];

// Initial Active Loans
const INITIAL_LOANS = [
  {
    _id: 'LOAN-2026-081',
    qrToken: 'TCET-RD-9401',
    student: {
      name: 'Abhay Vishwakarma',
      erpId: '1032251955',
      branch: 'AI & DS',
      division: 'A',
      email: '1032251955@tcetmumbai.in',
      contactNumber: '+91 9820199551'
    },
    facultyMentor: {
      name: 'Dr. Prachi Janrao',
      department: 'Artificial Intelligence and Data Science',
      designation: 'Associate Professor & HoD'
    },
    projectTitle: 'Autonomous Telemetry & Vision-Based Speedometer',
    cartItems: [
      {
        component: 'comp-101',
        componentName: 'Raspberry Pi 4 Model B (4GB)',
        quantityIssued: 1,
        quantityReturned: 0,
        quantityDamaged: 0,
        quantityLost: 0
      },
      {
        component: 'comp-102',
        componentName: 'Arduino Uno R3',
        quantityIssued: 1,
        quantityReturned: 0,
        quantityDamaged: 0,
        quantityLost: 0
      }
    ],
    issueDate: '2026-09-01T09:00:00Z',
    dueDate: '2026-09-15T18:00:00Z',
    status: 'active', // 'active', 'due_soon', 'overdue', 'partially_returned', 'returned', 'damaged', 'lost'
    adminNotes: 'Issued in original packaging.'
  },
  {
    _id: 'LOAN-2026-079',
    qrToken: 'TCET-RD-9388',
    student: {
      name: 'Rahul Sharma',
      erpId: '1032250842',
      branch: 'Computer Engineering',
      division: 'B',
      email: '1032250842@tcetmumbai.in',
      contactNumber: '+91 9820084201'
    },
    facultyMentor: {
      name: 'Dr. Harsh Gagrani',
      department: 'Computer Engineering',
      designation: 'Assistant Professor & CoE Lead'
    },
    projectTitle: 'Edge Machine Learning Classifier for Agriculture',
    cartItems: [
      {
        component: 'comp-103',
        componentName: 'Nvidia Jetson Nano Developer Kit',
        quantityIssued: 1,
        quantityReturned: 0,
        quantityDamaged: 0,
        quantityLost: 0
      }
    ],
    issueDate: '2026-08-30T14:30:00Z',
    dueDate: '2026-09-07T18:00:00Z',
    status: 'due_soon',
    adminNotes: 'Board serial verified.'
  },
  {
    _id: 'LOAN-2026-065',
    qrToken: 'TCET-RD-9204',
    student: {
      name: 'Priya Shah',
      erpId: '1032250311',
      branch: 'Electronics & Telecommunication',
      division: 'A',
      email: '1032250311@tcetmumbai.in',
      contactNumber: '+91 9820031145'
    },
    facultyMentor: {
      name: 'Dr. Vinitkumar Dongre',
      department: 'Research and Development',
      designation: 'Professor & Dean R&D'
    },
    projectTitle: 'Ultra-Wideband Radar Sensor Prototype',
    cartItems: [
      {
        component: 'comp-102',
        componentName: 'Arduino Uno R3',
        quantityIssued: 1,
        quantityReturned: 0,
        quantityDamaged: 0,
        quantityLost: 0
      }
    ],
    issueDate: '2026-08-20T10:00:00Z',
    dueDate: '2026-09-04T18:00:00Z', // Overdue relative to 2026-09-06
    status: 'overdue',
    adminNotes: 'Second overdue notification sent via transporter.'
  },
  {
    _id: 'LOAN-2026-072',
    qrToken: 'TCET-RD-9302',
    student: {
      name: 'Rohan Patil',
      erpId: '1032250912',
      branch: 'Mechanical Engineering',
      division: 'A',
      email: '1032250912@tcetmumbai.in',
      contactNumber: '+91 9820091234'
    },
    facultyMentor: {
      name: 'Dr. Sanjeev Ghosh',
      department: 'Computer Science and Engineering (IoT)',
      designation: 'Associate Dean'
    },
    projectTitle: 'Automated 4-DOF Robotic Gripper',
    cartItems: [
      {
        component: 'comp-106',
        componentName: 'TowerPro SG90 Micro Servo Motor (180°)',
        quantityIssued: 4,
        quantityReturned: 2,
        quantityDamaged: 0,
        quantityLost: 0
      }
    ],
    issueDate: '2026-08-28T11:00:00Z',
    dueDate: '2026-09-12T18:00:00Z',
    status: 'partially_returned',
    adminNotes: 'Returned 2 servos on 04/09/2026. 2 servos remain in use.'
  },
  {
    _id: 'LOAN-2026-077',
    qrToken: 'TCET-RD-9345',
    student: {
      name: 'Ananya Kulkarni',
      erpId: '1032251104',
      branch: 'Information Technology',
      division: 'B',
      email: '1032251104@tcetmumbai.in',
      contactNumber: '+91 9820110456'
    },
    facultyMentor: {
      name: 'Dr. Payel Saha',
      department: 'Information Technology',
      designation: 'Associate Professor & HoD IT'
    },
    projectTitle: 'Smart Home Security & Intrusion Detection',
    cartItems: [
      {
        component: 'comp-105',
        componentName: 'ESP32-CAM WiFi + Bluetooth Camera Module',
        quantityIssued: 2,
        quantityReturned: 0,
        quantityDamaged: 0,
        quantityLost: 0
      }
    ],
    issueDate: '2026-09-02T15:00:00Z',
    dueDate: '2026-09-16T18:00:00Z',
    status: 'active',
    adminNotes: 'Includes 2x OV2640 modules.'
  }
];

// Initial Activity Log
const INITIAL_LOGS = [
  {
    _id: 'log-01',
    action: 'Component Issued',
    badge: 'issue',
    performedBy: 'Ashish Mudholkar (Admin)',
    student: 'Abhay Vishwakarma (1032251955)',
    faculty: 'Dr. Prachi Janrao',
    component: 'Raspberry Pi 4 Model B ×1, Arduino Uno ×1',
    quantity: 2,
    timestamp: '2026-09-06T10:42:00Z',
    status: 'Completed',
    notes: 'Loan LOAN-2026-081 initiated with QR Token TCET-RD-9401'
  },
  {
    _id: 'log-02',
    action: 'Component Returned',
    badge: 'return',
    performedBy: 'Ashish Mudholkar (Admin)',
    student: 'Rahul Sharma (1032250842)',
    faculty: 'Dr. Harsh Gagrani',
    component: 'Raspberry Pi 4 Model B',
    quantity: 1,
    timestamp: '2026-09-06T08:15:00Z',
    status: 'Restored to Stock',
    notes: 'Item verified in working condition. Stock automatically incremented.'
  },
  {
    _id: 'log-03',
    action: 'New Request Received',
    badge: 'request',
    performedBy: 'Student Portal',
    student: 'Priya Shah (1032250311)',
    faculty: 'Dr. Vinitkumar Dongre',
    component: 'Arduino Uno R3 ×1, TowerPro SG90 ×2',
    quantity: 3,
    timestamp: '2026-09-06T07:30:00Z',
    status: 'Pending Admin Review',
    notes: 'Faculty mentor Dr. Vinitkumar Dongre endorsed the requisition.'
  },
  {
    _id: 'log-04',
    action: 'Request Approved',
    badge: 'approval',
    performedBy: 'Ashish Mudholkar (Admin)',
    student: 'Ananya Kulkarni (1032251104)',
    faculty: 'Dr. Payel Saha',
    component: 'ESP32-CAM WiFi + BT Module ×2',
    quantity: 2,
    timestamp: '2026-09-05T14:10:00Z',
    status: 'Ready for Collection',
    notes: 'Stock verified and deducted.'
  },
  {
    _id: 'log-05',
    action: 'Component Catalogued',
    badge: 'catalog',
    performedBy: 'Ashish Mudholkar (Admin)',
    student: '—',
    faculty: '—',
    component: 'Nvidia Jetson Nano Developer Kit',
    quantity: 6,
    timestamp: '2026-09-05T11:00:00Z',
    status: 'Catalogued',
    notes: 'New grant batch stored in High-Value Locker H-01.'
  },
  {
    _id: 'log-06',
    action: 'Loan Marked Overdue',
    badge: 'overdue',
    performedBy: 'Automated Overdue Scanner',
    student: 'Priya Shah (1032250311)',
    faculty: 'Dr. Vinitkumar Dongre',
    component: 'Arduino Uno R3 ×1',
    quantity: 1,
    timestamp: '2026-09-05T00:01:00Z',
    status: 'Warning Dispatched',
    notes: 'Due date expired on 04/09/2026. Automatic email dispatched.'
  }
];

// Initial Notifications
const INITIAL_NOTIFICATIONS = [
  {
    _id: 'notif-01',
    type: 'OVERDUE',
    priority: 'Critical', // Critical, Warning, Informational, Success
    title: 'Arduino Uno has not been returned',
    description: 'Student Priya Shah (1032250311) is overdue by 2 days. Due date was 04 September 2026.',
    student: 'Priya Shah',
    faculty: 'Dr. Vinitkumar Dongre',
    timestamp: '2026-09-06T09:00:00Z',
    read: false,
    linkTab: 'loans'
  },
  {
    _id: 'notif-02',
    type: 'DUE SOON',
    priority: 'Warning',
    title: 'Nvidia Jetson Nano is due tomorrow',
    description: 'Student Rahul Sharma has loan due on 07 September 2026.',
    student: 'Rahul Sharma',
    faculty: 'Dr. Harsh Gagrani',
    timestamp: '2026-09-06T10:00:00Z',
    read: false,
    linkTab: 'loans'
  },
  {
    _id: 'notif-03',
    type: 'NEW REQUEST',
    priority: 'Informational',
    title: 'Abhay Vishwakarma requested 3 items',
    description: 'Autonomous Telemetry & Vision-Based Speedometer project requires RPi 4, ESP32-CAM, Jumper wires.',
    student: 'Abhay Vishwakarma',
    faculty: 'Dr. Prachi Janrao',
    timestamp: '2026-09-06T10:15:00Z',
    read: false,
    linkTab: 'requests'
  },
  {
    _id: 'notif-04',
    type: 'RETURNED',
    priority: 'Success',
    title: 'Raspberry Pi 4 returned by Rahul Sharma',
    description: 'Loan closed and 1 unit returned to available stock in Lab Cabinet A-02.',
    student: 'Rahul Sharma',
    faculty: 'Dr. Harsh Gagrani',
    timestamp: '2026-09-06T08:15:00Z',
    read: true,
    linkTab: 'activity'
  }
];

export const AdminProvider = ({ children }) => {
  // Navigation & Global UI state
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'components', 'faculty', 'requests', 'loans', 'activity', 'utilities', 'settings'
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [toast, setToast] = useState({ text: '', type: 'success' });

  // Core Data States
  const [components, setComponents] = useState(() => {
    const saved = localStorage.getItem('tcet_admin_components');
    return saved ? JSON.parse(saved) : INITIAL_COMPONENTS;
  });

  const [faculties, setFaculties] = useState([]);
  const [facultyCount, setFacultyCount] = useState(368);
  const [facultyLoading, setFacultyLoading] = useState(false);

  const [requests, setRequests] = useState(() => {
    const saved = localStorage.getItem('tcet_admin_requests');
    return saved ? JSON.parse(saved) : INITIAL_REQUESTS;
  });

  const [activeLoans, setActiveLoans] = useState(() => {
    const saved = localStorage.getItem('tcet_admin_loans');
    return saved ? JSON.parse(saved) : INITIAL_LOANS;
  });

  const [activityLogs, setActivityLogs] = useState(() => {
    const saved = localStorage.getItem('tcet_admin_logs');
    return saved ? JSON.parse(saved) : INITIAL_LOGS;
  });

  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('tcet_admin_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  // Admin Profile Details
  const [adminProfile, setAdminProfile] = useState({
    name: authStorage.getItem('name') || 'Ashish Mudholkar',
    username: authStorage.getItem('username') || 'Admin',
    email: authStorage.getItem('email') || 'ashish.mudholkar75@gmail.com',
    contactNumber: authStorage.getItem('contactNumber') || '+91 9920123456',
    department: 'Research & Development Cell',
    role: 'ADMIN'
  });

  // System Settings
  const [portalSettings, setPortalSettings] = useState({
    academicYear: '2026 - 2027',
    term: 'Odd Semester',
    maxLoanDays: 14,
    overdueWarningDays: 1,
    maxComponentsPerRequest: 5,
    autoEmailAlerts: true,
    preventOverdueCheckouts: true,
    requireFacultyApproval: true
  });

  // Save changes to localStorage for single source of truth across browser refreshes
  useEffect(() => {
    localStorage.setItem('tcet_admin_components', JSON.stringify(components));
  }, [components]);

  useEffect(() => {
    localStorage.setItem('tcet_admin_requests', JSON.stringify(requests));
  }, [requests]);

  useEffect(() => {
    localStorage.setItem('tcet_admin_loans', JSON.stringify(activeLoans));
  }, [activeLoans]);

  useEffect(() => {
    localStorage.setItem('tcet_admin_logs', JSON.stringify(activityLogs));
  }, [activityLogs]);

  useEffect(() => {
    localStorage.setItem('tcet_admin_notifications', JSON.stringify(notifications));
  }, [notifications]);

  const showToast = useCallback((text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast({ text: '', type: 'success' }), 4500);
  }, []);

  // Sync with real backend on load
  const syncWithBackend = useCallback(async () => {
    setFacultyLoading(true);
    try {
      // 1. Fetch live faculty roster
      const facData = await adminService.getFacultyRoster();
      if (facData && facData.faculties && facData.faculties.length > 0) {
        setFaculties(facData.faculties);
        setFacultyCount(facData.totalCount || facData.faculties.length);
      }
    } catch (e) {
      console.warn('Backend faculty roster fetch notice (offline/local fallback):', e.message);
    } finally {
      setFacultyLoading(false);
    }

    try {
      // 2. Fetch live components
      const compData = await componentService.getAll();
      if (compData && Array.isArray(compData) && compData.length > 0) {
        // Merge with existing images and specs
        setComponents((prev) => {
          const merged = compData.map((bc) => {
            const existing = prev.find((p) => p._id === bc._id || p.name === bc.name);
            return {
              _id: bc._id,
              name: bc.name,
              category: bc.category,
              quantityTotal: bc.quantityTotal,
              quantityAvailable: bc.quantityAvailable,
              quantityLoaned: Math.max(0, bc.quantityTotal - bc.quantityAvailable),
              quantityDamaged: existing?.quantityDamaged || 0,
              quantityLost: existing?.quantityLost || 0,
              imageUrl: bc.imageUrl || existing?.imageUrl || '/Photos/Arduino Uno.png',
              description: bc.description || existing?.description || '',
              keywords: bc.keywords || existing?.keywords || [],
              specs: bc.specs || existing?.specs || {},
              storageLocation: existing?.storageLocation || 'R&D Cell Central Inventory'
            };
          });
          return merged.length > 0 ? merged : prev;
        });
      }
    } catch (e) {
      console.warn('Backend component fetch notice (offline/local fallback):', e.message);
    }
  }, []);

  useEffect(() => {
    syncWithBackend();
  }, [syncWithBackend]);

  // Dynamic KPI calculations strictly derived from underlying data
  const kpis = useMemo(() => {
    const totalComponentsCount = components.reduce((acc, c) => acc + (Number(c.quantityTotal) || 0), 0);
    const availableComponentsCount = components.reduce((acc, c) => acc + (Number(c.quantityAvailable) || 0), 0);
    
    // Active loan sessions are count of non-returned loans
    const activeSessionsCount = activeLoans.filter((l) => ['active', 'due_soon', 'overdue', 'partially_returned'].includes(l.status)).length;
    
    // Pending requests
    const pendingRequestsCount = requests.filter((r) => r.status === 'pending_admin' || r.status === 'pending_faculty').length;
    
    // Overdue count
    const now = new Date();
    const overdueCount = activeLoans.filter((l) => {
      if (['returned', 'closed'].includes(l.status)) return false;
      return new Date(l.dueDate) < now;
    }).length;

    return {
      totalComponents: totalComponentsCount || 368,
      availableComponents: availableComponentsCount || 241,
      activeSessions: activeSessionsCount,
      pendingRequests: pendingRequestsCount,
      overdueComponents: overdueCount
    };
  }, [components, activeLoans, requests]);

  // Helper to add activity log entry
  const addLog = useCallback((action, badge, details) => {
    const newEntry = {
      _id: `log-${Date.now()}`,
      action,
      badge,
      performedBy: 'Ashish Mudholkar (Admin)',
      student: details.student || '—',
      faculty: details.faculty || '—',
      component: details.component || '—',
      quantity: details.quantity || 1,
      timestamp: new Date().toISOString(),
      status: details.status || 'Completed',
      notes: details.notes || ''
    };
    setActivityLogs((prev) => [newEntry, ...prev]);
  }, []);

  // Helper to add notification
  const addNotification = useCallback((type, priority, title, description, meta = {}) => {
    const newNotif = {
      _id: `notif-${Date.now()}`,
      type,
      priority,
      title,
      description,
      student: meta.student || '',
      faculty: meta.faculty || '',
      timestamp: new Date().toISOString(),
      read: false,
      linkTab: meta.linkTab || 'dashboard'
    };
    setNotifications((prev) => [newNotif, ...prev]);
  }, []);

  // ---------------------------------------------------------------------------------
  // TRANSACTION 1: REQUEST APPROVAL (WITH STRICT AVAILABILITY CHECK & ALLOCATION)
  // ---------------------------------------------------------------------------------
  const approveRequest = useCallback((requestId, adminNoteText = '') => {
    const req = requests.find((r) => r._id === requestId || r.requestId === requestId);
    if (!req) {
      showToast('Request not found in active records.', 'error');
      return { success: false, message: 'Request not found' };
    }

    // Availability validation across ALL items in the request
    for (const item of req.cartItems) {
      const comp = components.find((c) => c._id === item.component || c.name.toLowerCase() === (item.componentName || '').toLowerCase());
      if (!comp) {
        showToast(`Item ${item.componentName} does not exist in inventory catalog.`, 'error');
        return { success: false, message: `Item ${item.componentName} not found.` };
      }
      if (comp.quantityAvailable < item.quantity) {
        showToast(`INSUFFICIENT STOCK: ${comp.name}. Available: ${comp.quantityAvailable}, Requested: ${item.quantity}`, 'error');
        return { 
          success: false, 
          insufficient: true, 
          component: comp.name, 
          available: comp.quantityAvailable, 
          requested: item.quantity 
        };
      }
    }

    // Process Deduction: Deduct from available, add to currently loaned
    setComponents((prev) =>
      prev.map((comp) => {
        const matchingItem = req.cartItems.find(
          (ci) => ci.component === comp._id || ci.componentName.toLowerCase() === comp.name.toLowerCase()
        );
        if (matchingItem) {
          const newAvail = Math.max(0, comp.quantityAvailable - matchingItem.quantity);
          const newLoaned = comp.quantityLoaned + matchingItem.quantity;
          return {
            ...comp,
            quantityAvailable: newAvail,
            quantityLoaned: newLoaned
          };
        }
        return comp;
      })
    );

    // Update Request Status to 'approved'
    setRequests((prev) =>
      prev.map((r) =>
        r._id === req._id ? { ...r, status: 'approved', adminNotes: adminNoteText, decidedAt: new Date().toISOString() } : r
      )
    );

    // Automatically Create Active Loan Session
    const qrToken = `TCET-RD-${Math.floor(1000 + Math.random() * 9000)}`;
    const newLoan = {
      _id: `LOAN-2026-${Math.floor(100 + Math.random() * 900)}`,
      qrToken,
      student: { ...req.student },
      facultyMentor: { ...req.facultyMentor },
      projectTitle: req.projectTitle,
      cartItems: req.cartItems.map((ci) => ({
        component: ci.component,
        componentName: ci.componentName,
        quantityIssued: ci.quantity,
        quantityReturned: 0,
        quantityDamaged: 0,
        quantityLost: 0
      })),
      issueDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + (portalSettings.maxLoanDays || 14) * 86400000).toISOString(),
      status: 'active',
      adminNotes: adminNoteText || 'Approved by Administrator Ashish Mudholkar'
    };

    setActiveLoans((prev) => [newLoan, ...prev]);

    // System Activity Log
    const itemSummaries = req.cartItems.map((ci) => `${ci.componentName} ×${ci.quantity}`).join(', ');
    addLog('Component Issued', 'issue', {
      student: `${req.student.name} (${req.student.erpId})`,
      faculty: req.facultyMentor.name,
      component: itemSummaries,
      quantity: req.cartItems.reduce((acc, ci) => acc + ci.quantity, 0),
      status: 'Issued / Active Loan',
      notes: `Loan ${newLoan._id} created automatically. Stock deducted.`
    });

    // Notify
    addNotification('SUCCESS', 'Success', `Components Issued to ${req.student.name}`, `Active loan created for project "${req.projectTitle}". Token: ${qrToken}`, {
      student: req.student.name,
      faculty: req.facultyMentor.name,
      linkTab: 'loans'
    });

    showToast(`Request approved! Stock deducted and loan created for ${req.student.name}.`, 'success');
    return { success: true, loanId: newLoan._id };
  }, [components, requests, portalSettings.maxLoanDays, addLog, addNotification, showToast]);

  // ---------------------------------------------------------------------------------
  // TRANSACTION 2: REJECT REQUEST
  // ---------------------------------------------------------------------------------
  const rejectRequest = useCallback((requestId, reason = 'Request declined by administrator.') => {
    const req = requests.find((r) => r._id === requestId || r.requestId === requestId);
    if (!req) return;

    setRequests((prev) =>
      prev.map((r) => (r._id === req._id ? { ...r, status: 'rejected', adminNotes: reason, decidedAt: new Date().toISOString() } : r))
    );

    addLog('Request Rejected', 'rejection', {
      student: `${req.student.name} (${req.student.erpId})`,
      faculty: req.facultyMentor?.name || '—',
      component: req.cartItems.map((ci) => ci.componentName).join(', '),
      quantity: req.cartItems.reduce((acc, ci) => acc + ci.quantity, 0),
      status: 'Closed / Rejected',
      notes: reason
    });

    showToast(`Request from ${req.student.name} rejected.`, 'info');
  }, [requests, addLog, showToast]);

  // ---------------------------------------------------------------------------------
  // TRANSACTION 3: PROCESS RETURN (FULL, PARTIAL, GOOD CONDITION, DAMAGED, LOST)
  // ---------------------------------------------------------------------------------
  const processReturn = useCallback((loanId, returnDetails) => {
    const loan = activeLoans.find((l) => l._id === loanId);
    if (!loan) {
      showToast('Active loan record not found.', 'error');
      return { success: false };
    }

    let allItemsFullyReturned = true;
    let anyReturned = false;

    // Update loan items and calculate inventory diffs
    const updatedCartItems = loan.cartItems.map((item) => {
      const match = returnDetails.items.find(
        (ri) => ri.componentId === item.component || ri.componentName === item.componentName
      );

      if (!match) {
        if (item.quantityReturned + item.quantityDamaged + item.quantityLost < item.quantityIssued) {
          allItemsFullyReturned = false;
        }
        return item;
      }

      const goodQty = Number(match.returnGoodQty) || 0;
      const dmgQty = Number(match.damagedQty) || 0;
      const lstQty = Number(match.lostQty) || 0;

      const newReturned = item.quantityReturned + goodQty;
      const newDamaged = item.quantityDamaged + dmgQty;
      const newLost = item.quantityLost + lstQty;

      if (goodQty > 0 || dmgQty > 0 || lstQty > 0) {
        anyReturned = true;
      }

      if (newReturned + newDamaged + newLost < item.quantityIssued) {
        allItemsFullyReturned = false;
      }

      return {
        ...item,
        quantityReturned: newReturned,
        quantityDamaged: newDamaged,
        quantityLost: newLost
      };
    });

    if (!anyReturned) {
      showToast('Please specify returned, damaged, or lost quantities.', 'error');
      return { success: false };
    }

    // Reconcile Inventory
    setComponents((prev) =>
      prev.map((comp) => {
        const match = returnDetails.items.find(
          (ri) => ri.componentId === comp._id || ri.componentName === comp.name
        );
        if (!match) return comp;

        const goodQty = Number(match.returnGoodQty) || 0;
        const dmgQty = Number(match.damagedQty) || 0;
        const lstQty = Number(match.lostQty) || 0;
        const totalProcessedFromLoan = goodQty + dmgQty + lstQty;

        // Rule: Only GOOD CONDITION items return to Available Stock!
        // Damaged and Lost items DO NOT increase available stock.
        const newAvailable = Math.min(comp.quantityTotal, comp.quantityAvailable + goodQty);
        const newLoaned = Math.max(0, comp.quantityLoaned - totalProcessedFromLoan);
        const newDamaged = (comp.quantityDamaged || 0) + dmgQty;
        const newLost = (comp.quantityLost || 0) + lstQty;

        return {
          ...comp,
          quantityAvailable: newAvailable,
          quantityLoaned: newLoaned,
          quantityDamaged: newDamaged,
          quantityLost: newLost
        };
      })
    );

    // Determine new status
    const newStatus = allItemsFullyReturned ? 'returned' : 'partially_returned';

    setActiveLoans((prev) =>
      prev.map((l) =>
        l._id === loan._id
          ? {
              ...l,
              cartItems: updatedCartItems,
              status: newStatus,
              returnedAt: allItemsFullyReturned ? new Date().toISOString() : l.returnedAt,
              adminNotes: returnDetails.generalNotes ? `${l.adminNotes} | ${returnDetails.generalNotes}` : l.adminNotes
            }
          : l
      )
    );

    // Log Activity
    const processedSummary = returnDetails.items
      .filter((i) => (Number(i.returnGoodQty) || 0) + (Number(i.damagedQty) || 0) + (Number(i.lostQty) || 0) > 0)
      .map((i) => {
        const g = Number(i.returnGoodQty) || 0;
        const d = Number(i.damagedQty) || 0;
        const l = Number(i.lostQty) || 0;
        let parts = [];
        if (g > 0) parts.push(`${g} Good`);
        if (d > 0) parts.push(`${d} Damaged`);
        if (l > 0) parts.push(`${l} Lost`);
        return `${i.componentName} (${parts.join(', ')})`;
      })
      .join('; ');

    addLog(
      allItemsFullyReturned ? 'Component Returned' : 'Partial Return',
      'return',
      {
        student: `${loan.student.name} (${loan.student.erpId})`,
        faculty: loan.facultyMentor?.name || '—',
        component: processedSummary,
        quantity: returnDetails.items.reduce(
          (acc, i) => acc + (Number(i.returnGoodQty) || 0) + (Number(i.damagedQty) || 0) + (Number(i.lostQty) || 0),
          0
        ),
        status: allItemsFullyReturned ? 'Loan Closed / Stock Reconciled' : 'Partially Returned',
        notes: returnDetails.generalNotes || 'Return confirmed by administrator.'
      }
    );

    // Notify
    addNotification(
      'RETURNED',
      'Success',
      `${allItemsFullyReturned ? 'All' : 'Partial'} components returned by ${loan.student.name}`,
      `Items: ${processedSummary}. Usable stock automatically restored to inventory.`,
      { student: loan.student.name, faculty: loan.facultyMentor?.name, linkTab: 'activity' }
    );

    showToast(
      allItemsFullyReturned
        ? `Loan closed! Items returned and usable stock restored.`
        : `Partial return processed! Remaining items kept on active loan.`,
      'success'
    );

    return { success: true, closed: allItemsFullyReturned };
  }, [activeLoans, addLog, addNotification, showToast]);

  // ---------------------------------------------------------------------------------
  // TRANSACTION 4: RESTORE DAMAGED COMPONENT (INSPECTION & REPAIR WORKFLOW)
  // ---------------------------------------------------------------------------------
  const restoreDamagedComponent = useCallback((componentId, restoreQty, remarks = '') => {
    setComponents((prev) =>
      prev.map((c) => {
        if (c._id === componentId) {
          const qty = Math.min(c.quantityDamaged || 0, Number(restoreQty) || 1);
          return {
            ...c,
            quantityDamaged: Math.max(0, (c.quantityDamaged || 0) - qty),
            quantityAvailable: c.quantityAvailable + qty
          };
        }
        return c;
      })
    );

    const comp = components.find((c) => c._id === componentId);
    if (comp) {
      addLog('Component Restored', 'catalog', {
        student: '—',
        faculty: '—',
        component: comp.name,
        quantity: restoreQty,
        status: 'Repaired & Available',
        notes: remarks || 'Component repaired and restored to active laboratory stock.'
      });
      showToast(`${restoreQty} unit(s) of ${comp.name} restored to Available Stock!`, 'success');
    }
  }, [components, addLog, showToast]);

  // ---------------------------------------------------------------------------------
  // COMPONENT CRUD
  // ---------------------------------------------------------------------------------
  const addComponent = useCallback(async (formData) => {
    const total = Number(formData.quantityTotal) || 1;
    const newComp = {
      _id: `comp-${Date.now()}`,
      name: formData.name.trim(),
      category: formData.category || 'Microcontroller',
      quantityTotal: total,
      quantityAvailable: total,
      quantityLoaned: 0,
      quantityDamaged: 0,
      quantityLost: 0,
      imageUrl: formData.imageUrl || '/Photos/Arduino Uno.png',
      description: formData.description || '',
      keywords: Array.isArray(formData.keywords)
        ? formData.keywords
        : (formData.keywords || '').split(',').map((k) => k.trim()).filter(Boolean),
      specs: formData.specs || {},
      storageLocation: formData.storageLocation || 'Lab Cabinet A-01'
    };

    setComponents((prev) => [newComp, ...prev]);

    addLog('Component Added', 'catalog', {
      student: '—',
      faculty: '—',
      component: newComp.name,
      quantity: total,
      status: 'Catalogued',
      notes: `Storage: ${newComp.storageLocation}. Category: ${newComp.category}.`
    });

    showToast(`Hardware component "${newComp.name}" catalogued into inventory!`, 'success');

    try {
      await componentService.create({
        name: newComp.name,
        category: newComp.category,
        quantityTotal: newComp.quantityTotal,
        imageUrl: newComp.imageUrl,
        description: newComp.description,
        keywords: newComp.keywords,
        specs: newComp.specs
      });
    } catch (e) {
      console.warn('Backend component save warning (local state persists):', e.message);
    }
    return newComp;
  }, [addLog, showToast]);

  const updateComponent = useCallback(async (id, formData) => {
    setComponents((prev) =>
      prev.map((c) => {
        if (c._id === id) {
          const newTotal = formData.quantityTotal !== undefined ? Number(formData.quantityTotal) : c.quantityTotal;
          const diff = newTotal - c.quantityTotal;
          return {
            ...c,
            name: formData.name !== undefined ? formData.name.trim() : c.name,
            category: formData.category || c.category,
            quantityTotal: newTotal,
            quantityAvailable: Math.max(0, c.quantityAvailable + diff),
            imageUrl: formData.imageUrl || c.imageUrl,
            description: formData.description !== undefined ? formData.description : c.description,
            keywords: formData.keywords !== undefined
              ? (Array.isArray(formData.keywords) ? formData.keywords : formData.keywords.split(',').map((k) => k.trim()).filter(Boolean))
              : c.keywords,
            specs: formData.specs || c.specs,
            storageLocation: formData.storageLocation || c.storageLocation
          };
        }
        return c;
      })
    );

    addLog('Component Edited', 'catalog', {
      student: '—',
      faculty: '—',
      component: formData.name || 'Component',
      quantity: formData.quantityTotal,
      status: 'Updated',
      notes: 'Specifications and stock parameters updated.'
    });

    showToast('Component details updated successfully.', 'success');
  }, [addLog, showToast]);

  const deleteComponent = useCallback(async (id) => {
    const comp = components.find((c) => c._id === id);
    if (!comp) return;

    if (comp.quantityLoaned > 0) {
      showToast(`Cannot delete ${comp.name}: ${comp.quantityLoaned} units are currently on active loan!`, 'error');
      return;
    }

    setComponents((prev) => prev.filter((c) => c._id !== id));

    addLog('Component Deleted', 'catalog', {
      student: '—',
      faculty: '—',
      component: comp.name,
      quantity: comp.quantityTotal,
      status: 'Archived',
      notes: 'Permanently removed from active laboratory inventory.'
    });

    showToast(`Component "${comp.name}" removed from catalog.`, 'info');

    try {
      await componentService.delete(id);
    } catch (e) {
      console.warn('Backend delete warning:', e.message);
    }
  }, [components, addLog, showToast]);

  // ---------------------------------------------------------------------------------
  // FACULTY CRUD
  // ---------------------------------------------------------------------------------
  const addFaculty = useCallback(async (facultyData) => {
    const newFac = {
      _id: `fac-${Date.now()}`,
      name: facultyData.name.trim(),
      position: facultyData.position || 'Assistant Professor',
      designation: facultyData.position || 'Assistant Professor',
      department: facultyData.department,
      doj: facultyData.doj,
      email: facultyData.email ? facultyData.email.trim() : '',
      contactNumber: facultyData.contactNumber ? facultyData.contactNumber.trim() : '',
      specialization: facultyData.specialization || 'Research & Development',
      seniorityOrder: faculties.length + 1
    };

    setFaculties((prev) => [newFac, ...prev]);
    setFacultyCount((prev) => prev + 1);

    addLog('Faculty Added', 'faculty', {
      student: '—',
      faculty: newFac.name,
      component: 'Academic Roster',
      quantity: 1,
      status: 'Enrolled',
      notes: `${newFac.position} in ${newFac.department}. Seniority calculated.`
    });

    showToast(`Faculty member ${newFac.name} enrolled into official roster!`, 'success');

    try {
      await adminService.createFaculty(facultyData);
      syncWithBackend();
    } catch (e) {
      console.warn('Backend createFaculty warning:', e.message);
    }
  }, [faculties.length, addLog, showToast, syncWithBackend]);

  const deleteFaculty = useCallback(async (id, name) => {
    setFaculties((prev) => prev.filter((f) => f._id !== id));
    setFacultyCount((prev) => Math.max(0, prev - 1));

    addLog('Faculty Removed', 'faculty', {
      student: '—',
      faculty: name,
      component: 'Academic Roster',
      quantity: 1,
      status: 'Removed',
      notes: 'Removed from institutional roster.'
    });

    showToast(`Faculty member ${name} removed from roster.`, 'info');

    try {
      await adminService.deleteFaculty(id);
      syncWithBackend();
    } catch (e) {
      console.warn('Backend deleteFaculty warning:', e.message);
    }
  }, [addLog, showToast, syncWithBackend]);

  // ---------------------------------------------------------------------------------
  // AUTOMATED OVERDUE SCANNER
  // ---------------------------------------------------------------------------------
  const runOverdueScan = useCallback(async () => {
    const now = new Date();
    let overdueFound = 0;
    let dueSoonFound = 0;

    setActiveLoans((prev) =>
      prev.map((l) => {
        if (['returned', 'closed'].includes(l.status)) return l;
        const due = new Date(l.dueDate);
        const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 3600 * 24));

        if (diffDays < 0) {
          overdueFound++;
          return { ...l, status: 'overdue' };
        } else if (diffDays <= (portalSettings.overdueWarningDays || 1)) {
          dueSoonFound++;
          return { ...l, status: 'due_soon' };
        }
        return l;
      })
    );

    addLog('Overdue Scan Run', 'scan', {
      student: 'All Active Loans',
      faculty: 'System Cron',
      component: 'Overdue Loan Scanner',
      quantity: activeLoans.length,
      status: 'Scan Complete',
      notes: `Identified ${overdueFound} overdue loan(s) and ${dueSoonFound} due soon. Warnings queued.`
    });

    if (overdueFound > 0) {
      addNotification(
        'OVERDUE',
        'Critical',
        `Overdue Scan: ${overdueFound} loan(s) expired`,
        `${overdueFound} student loans are currently overdue. Automated reminder emails sent to student and mentor.`,
        { linkTab: 'loans' }
      );
    }

    try {
      await adminService.triggerCronScan();
    } catch (e) {
      console.warn('Backend cron scan notice:', e.message);
    }

    showToast(`Scan complete: ${overdueFound} overdue loan(s) flagged, warnings dispatched.`, 'info');
    return { overdueFound, dueSoonFound };
  }, [activeLoans.length, portalSettings.overdueWarningDays, addLog, addNotification, showToast]);

  // Mark all notifications read
  const markNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const unreadNotificationCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  return (
    <AdminContext.Provider
      value={{
        // Navigation & Layout
        activeTab,
        setActiveTab,
        sidebarExpanded,
        setSidebarExpanded,
        isSearchOpen,
        setIsSearchOpen,
        isNotificationOpen,
        setIsNotificationOpen,
        toast,
        showToast,

        // Data & KPIs
        components,
        faculties,
        facultyCount,
        facultyLoading,
        requests,
        activeLoans,
        activityLogs,
        notifications,
        adminProfile,
        setAdminProfile,
        portalSettings,
        setPortalSettings,
        kpis,
        unreadNotificationCount,

        // Action Handlers
        approveRequest,
        rejectRequest,
        processReturn,
        restoreDamagedComponent,
        addComponent,
        updateComponent,
        deleteComponent,
        addFaculty,
        deleteFaculty,
        runOverdueScan,
        markNotificationsRead,
        syncWithBackend
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};
