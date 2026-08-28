import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import Student from './models/Student.js';
import Faculty from './models/Faculty.js';
import Component from './models/Component.js';
import BorrowRecord from './models/BorrowRecord.js';
import { generateStudentCredentials } from './utils/generateCredentials.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const generateMockData = async () => {
  try {
    await connectDB();

    // Clear existing Student, Component, BorrowRecord
    await Student.deleteMany({});
    await Component.deleteMany({});
    await BorrowRecord.deleteMany({});
    console.log('Cleared existing Students, Components, and BorrowRecords.');

    // 1. Load Student list from scratch/students.json
    const studentsJsonPath = path.join(__dirname, '../database/students.json');
    let studentsRawList = [];

    if (fs.existsSync(studentsJsonPath)) {
      studentsRawList = JSON.parse(fs.readFileSync(studentsJsonPath, 'utf8'));
      console.log(`Loaded ${studentsRawList.length} students from Excel dataset.`);
    } else {
      console.warn('Excel student dataset not found at scratch path, using backup list.');
      studentsRawList = [
        { name: "Anik Tiwari", email: "1032250997@tcetmumbai.in", erpId: "1032250997", rollNo: 997, branch: "Information Technology", division: "A" }
      ];
    }

    // 2. Generate Credentials and write to CSV
    const csvHeader = 'Name,ERP_ID,Email,UserID,Password\n';
    let csvContent = csvHeader;
    const seededStudents = [];
    const salt = await bcrypt.genSalt(10);

    for (const student of studentsRawList) {
      let { username, password } = generateStudentCredentials(student.erpId);
      if (student.password) {
        password = student.password;
      }
      if (student.userId) {
        username = student.userId;
      }
      
      // Append to CSV content
      csvContent += `"${student.name}","${student.erpId}","${student.email}","${username}","${password}"\n`;

      // Hashed Password for Database
      const hashedPassword = await bcrypt.hash(password, salt);

      seededStudents.push({
        erpId: student.erpId,
        userId: username,
        password: hashedPassword,
        name: student.name,
        email: student.email,
        branch: student.branch || 'Computer Engineering',
        year: student.year || 'Third Year',
        division: student.division || 'A',
        role: 'student',
        contactNumber: student.contactNumber || `9820${Math.floor(100000 + Math.random() * 900000)}`,
        department: student.department || 'Research and Development'
      });
    }

    // Save CSV credentials sheet
    const csvPath = path.join(__dirname, 'credentials.csv');
    fs.writeFileSync(csvPath, csvContent, 'utf8');
    console.log(`Successfully generated and wrote student credentials to: ${csvPath}`);

    // Insert students into DB
    const createdStudents = await Student.insertMany(seededStudents);
    console.log(`Inserted ${createdStudents.length} students into database.`);

    // 3. Seed expanded Components (ESP32 variants, RPi 3/4/5, Jetson Nano, cables/jumpers)
    const componentsData = [
      {
        name: 'Raspberry Pi 5 (8GB)',
        category: 'Development Board',
        specs: {
          'Processor': 'Broadcom BCM2712 Quad-Core 2.4GHz',
          'RAM': '8GB LPDDR4X-4267 SDRAM',
          'Graphics': 'VideoCore VII GPU @800MHz',
          'Ports': '2x USB 3.0, 2x USB 2.0, 2x Micro-HDMI (4kp60)',
          'Power': '5V/5A USB-C PD'
        },
        quantityTotal: 10,
        quantityAvailable: 10,
        imageUrl: 'https://images.unsplash.com/photo-1707923769941-86a01499538c?w=500&q=80',
        keywords: ['raspberry pi 5', 'pi 5', 'computer', 'broadcom', 'linux', 'python', 'edge ai', 'server'],
        description: 'The latest generation flagship single-board computer from Raspberry Pi. Delivers over 2-3x CPU and GPU performance compared to Pi 4. Ideal for high-end processing, machine learning, and automation.'
      },
      {
        name: 'Raspberry Pi 4 Model B (4GB)',
        category: 'Development Board',
        specs: {
          'Processor': 'Broadcom BCM2711 Quad-Core 1.5GHz',
          'RAM': '4GB LPDDR4',
          'Connectivity': 'Dual-band Wi-Fi, Bluetooth 5.0, Gigabit Ethernet',
          'Display': '2x Micro-HDMI (4kp60 support)',
          'USB': '2x USB 3.0, 2x USB 2.0'
        },
        quantityTotal: 15,
        quantityAvailable: 14,
        imageUrl: 'https://images.unsplash.com/photo-1618683515091-bf9a91012903?w=500&q=80',
        keywords: ['raspberry pi 4', 'pi 4', 'computer', 'linux', 'server', 'python', 'embedded'],
        description: 'Popular high-performance single-board computer. Suitable for embedded gateway nodes, computer vision servers, and laboratory coding sandboxes.'
      },
      {
        name: 'Raspberry Pi 3 Model B+',
        category: 'Development Board',
        specs: {
          'Processor': 'Broadcom BCM2837B0 Quad-Core 1.4GHz',
          'RAM': '1GB LPDDR2',
          'Connectivity': '2.4GHz/5GHz Wi-Fi, Bluetooth 4.2',
          'USB': '4x USB 2.0',
          'Power': '5V/2.5A Micro-USB'
        },
        quantityTotal: 8,
        quantityAvailable: 8,
        imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&q=80',
        keywords: ['raspberry pi 3', 'pi 3', 'computer', 'linux', 'legacy', 'embedded'],
        description: 'Standard single-board computer suitable for entry-level projects, basic terminal applications, and lightweight sensor hubs.'
      },
      {
        name: 'NVIDIA Jetson Nano Developer Kit',
        category: 'Development Board',
        specs: {
          'GPU': '128-core Maxwell GPU',
          'CPU': 'Quad-core ARM A57 @1.43 GHz',
          'RAM': '4GB 64-bit LPDDR4',
          'Video IO': 'HDMI 2.0 and eDP 1.4',
          'Connectivity': 'Gigabit Ethernet, M.2 Key E slot'
        },
        quantityTotal: 5,
        quantityAvailable: 5,
        imageUrl: 'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?w=500&q=80',
        keywords: ['jetson nano', 'nvidia', 'gpu', 'cuda', 'ai', 'computer vision', 'deep learning', 'tensorrt'],
        description: 'A powerful small-form computer that runs multiple neural networks in parallel. Designed for edge AI, object classification, segments estimation, and speech processing.'
      },
      {
        name: 'ESP32 Development Board (NodeMCU)',
        category: 'Microcontroller',
        specs: {
          'Processor': 'Dual-core Tensilica LX6 @240MHz',
          'Connectivity': 'Wi-Fi 802.11 b/g/n, Bluetooth BLE v4.2',
          'Pins': '38 GPIO pins',
          'Voltage': '3.3V / 5V USB input'
        },
        quantityTotal: 25,
        quantityAvailable: 23,
        imageUrl: 'https://images.unsplash.com/photo-1563770660941-20978e870e26?w=500&q=80',
        keywords: ['esp32', 'nodemcu', 'wifi', 'bluetooth', 'microcontroller', 'iot', 'smart home'],
        description: 'Classic dual-core ESP32 board. Perfect for IoT prototyping, custom sensors interfaces, and home automation systems.'
      },
      {
        name: 'ESP32S Development Module',
        category: 'Microcontroller',
        specs: {
          'Module': 'ESP32-S',
          'Flash Memory': '4MB SPI Flash',
          'Antenna': 'On-board PCB Trace antenna',
          'Core': 'Xtensa Dual-core 32-bit'
        },
        quantityTotal: 20,
        quantityAvailable: 20,
        imageUrl: 'https://images.unsplash.com/photo-1563770660941-20978e870e26?w=500&q=80',
        keywords: ['esp32s', 'esp32-s', 'microcontroller', 'module', 'embedded'],
        description: 'ESP32S module mounted on breakout board, offering high integration density for custom PCBs and IoT designs.'
      },
      {
        name: 'ESP32W (ESP32-WROOM-32D)',
        category: 'Microcontroller',
        specs: {
          'Module': 'ESP32-WROOM-32D',
          'SRAM': '520 KB',
          'Frequency': '240 MHz',
          'RF Certification': 'FCC/CE/IC/SRRC/NCC/MIC'
        },
        quantityTotal: 20,
        quantityAvailable: 20,
        imageUrl: 'https://images.unsplash.com/photo-1563770660941-20978e870e26?w=500&q=80',
        keywords: ['esp32w', 'wroom', 'esp32-wroom', 'wifi module'],
        description: 'Standard, highly certified Wi-Fi + BT + BLE MCU module. Highly recommended for industrial sensor nodes and enterprise-grade IoT endpoints.'
      },
      {
        name: 'ESP32SE (ESP32-S3-WROOM-1)',
        category: 'Microcontroller',
        specs: {
          'Processor': 'ESP32-S3 Xtensa LX7 Dual-Core',
          'AI Extension': 'Vector instructions for neural networks',
          'Flash': '8MB',
          'PSRAM': '8MB Octal'
        },
        quantityTotal: 15,
        quantityAvailable: 15,
        imageUrl: 'https://images.unsplash.com/photo-1563770660941-20978e870e26?w=500&q=80',
        keywords: ['esp32se', 'esp32-s3', 's3', 'neural network', 'vector', 'octal psram'],
        description: 'High performance ESP32-S3 module designed for Edge AI speech detection, wake word recognition, and neural network prototyping.'
      },
      {
        name: 'ESP32-CAM (ESPCam Module)',
        category: 'Microcontroller',
        specs: {
          'Camera': 'OV2640 2MP Camera included',
          'Flashlight': 'Built-in bright white LED flash',
          'Card Slot': 'MicroSD card slot',
          'RAM': '4MB PSRAM'
        },
        quantityTotal: 15,
        quantityAvailable: 15,
        imageUrl: 'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?w=500&q=80',
        keywords: ['espcam', 'esp32-cam', 'camera', 'video streaming', 'face recognition', 'ov2640'],
        description: 'Low-cost ESP32 module carrying an OV2640 camera lens, MicroSD card slot, and built-in flashlight. Excellent for smart doors, face recognition, and streaming.'
      },
      {
        name: 'Jumper Wire (Male-to-Male)',
        category: 'Passive Components',
        specs: {
          'Type': 'Male-to-Male (M-M)',
          'Length': '20cm',
          'Quantity': '40-pin ribbon set',
          'Wire Gauge': '28 AWG'
        },
        quantityTotal: 50,
        quantityAvailable: 50,
        imageUrl: 'https://images.unsplash.com/photo-1591453089816-0fbb971b454c?w=500&q=80',
        keywords: ['jumper wire', 'male-to-male', 'cable', 'connector', 'breadboard', 'wiring'],
        description: 'Ribbon set of 40 individual male-to-male jumper wires. Essential for establishing paths between breadboards and microcontroller sockets.'
      },
      {
        name: 'Jumper Wire (Female-to-Female)',
        category: 'Passive Components',
        specs: {
          'Type': 'Female-to-Female (F-F)',
          'Length': '20cm',
          'Quantity': '40-pin ribbon set',
          'Wire Gauge': '28 AWG'
        },
        quantityTotal: 50,
        quantityAvailable: 50,
        imageUrl: 'https://images.unsplash.com/photo-1591453089816-0fbb971b454c?w=500&q=80',
        keywords: ['jumper wire', 'female-to-female', 'cable', 'connector', 'sensor wiring'],
        description: 'Ribbon set of 40 individual female-to-female jumper wires. Ideal for connecting standalone sensor pins directly to male pin headers on development boards.'
      },
      {
        name: 'Arduino Connector Cable (USB A-B)',
        category: 'Communication Module',
        specs: {
          'Connectors': 'USB Type-A to USB Type-B',
          'Length': '50cm',
          'Shielding': 'Double shielded standard',
          'Compatibility': 'Arduino Uno / Mega'
        },
        quantityTotal: 30,
        quantityAvailable: 30,
        imageUrl: 'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?w=500&q=80',
        keywords: ['arduino connector', 'usb-ab', 'uno cable', 'mega cable', 'usb cable'],
        description: 'Standard USB Type-A to Type-B connector cable to power and upload sketches to Arduino Uno and Arduino Mega microcontrollers.'
      },
      {
        name: 'Code Uploading Cable (Micro USB / Type C)',
        category: 'Communication Module',
        specs: {
          'Connectors': 'USB A to Micro-USB & Type-C Combo',
          'Length': '1 meter',
          'Interface': 'USB 2.0 (High Speed Data)',
          'Material': 'Braid-reinforced nylon'
        },
        quantityTotal: 40,
        quantityAvailable: 40,
        imageUrl: 'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?w=500&q=80',
        keywords: ['code uploading cable', 'micro usb', 'usb-c', 'esp32 cable', 'type-c', 'programming cable'],
        description: 'Reliable, braid-reinforced data cable carrying both Micro-USB and USB-C connectors. Optimized for uploading firmware code onto ESP32 and NodeMCU boards.'
      },
      {
        name: 'Breadboard Hookup Connecting Cables',
        category: 'Passive Components',
        specs: {
          'Type': 'Pre-formed solid core wires',
          'Box Count': '140 pieces',
          'Length range': '2mm to 125mm',
          'Insulation': 'Color-coded PVC'
        },
        quantityTotal: 20,
        quantityAvailable: 20,
        imageUrl: 'https://images.unsplash.com/photo-1591453089816-0fbb971b454c?w=500&q=80',
        keywords: ['connecting cable', 'hookup wire', 'breadboard wires', 'solid core'],
        description: 'Compartment box carrying 140 pre-stripped and pre-bent solid-core hookup wires of varying lengths to construct clean, flat circuits on breadboards.'
      }
    ];

    const createdComponents = await Component.insertMany(componentsData);
    console.log(`Seeded ${createdComponents.length} hardware components with real specifications.`);

    // 4. Seed Mock BorrowRecords
    const facultyList = await Faculty.find({});
    if (facultyList.length === 0) {
      throw new Error('Seed faculty first using npm run seed!');
    }

    const mentor = facultyList[0]; // Dr. Vinitkumar Dongre
    const student = createdStudents[0];

    const compPi5 = createdComponents.find(c => c.name.includes('Pi 5'));
    const compCable = createdComponents.find(c => c.name.includes('Uploading'));
    const compESP = createdComponents.find(c => c.name.includes('NodeMCU'));

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    const record = new BorrowRecord({
      student: student._id,
      teamMembers: [],
      facultyMentor: mentor._id,
      projectTitle: 'Smart Surveillance Drone Gateway',
      projectDomain: 'Embedded AI',
      projectDescription: 'Deploying real-time object classification models using a camera module and Raspberry Pi 5.',
      cartItems: [
        { component: compPi5._id, quantity: 1 },
        { component: compCable._id, quantity: 1 }
      ],
      status: 'pending_admin',
      qrToken: `TCET-RND-${student.erpId}-INITSEED`,
      dueDate,
      facultyDecision: {
        approved: true,
        timestamp: new Date(),
        remarks: 'Approved for COE drone testing.'
      }
    });

    await record.save();
    console.log('Seeded initial mock BorrowRecord successfully.');

    // Adjust quantities
    await Component.updateOne({ _id: compPi5._id }, { $set: { quantityAvailable: 9 } });
    await Component.updateOne({ _id: compCable._id }, { $set: { quantityAvailable: 39 } });

    mongoose.connection.close();
    console.log('Data generation script completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error(`Mock data generation failed: ${error.message}`);
    process.exit(1);
  }
};

generateMockData();
