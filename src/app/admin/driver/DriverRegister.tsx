"use client";

import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import axios from 'axios';
import Modal from './Modal'; // Import the Modal component

const dlOptions = ['A', 'A1', 'B', 'B1', 'B2', 'C', 'D', 'BE', 'CE'];
const conditionOptions = ['1', '2', '3', '4', '5'];

interface Operator {
  id?: number;
  firstname: string;
  middlename: string;
  lastname: string;
  license_no: string;
  contact: string;
  region: string;
  city: string;
  brgy: string;
  street: string;
  type: string;
  dl_codes: string[]; // Ensure dl_codes is of type string[]
  conditions: string[]; // Ensure conditions is of type string[]
  expiration_date: string;
  emergency_name: string;
  emergency_address: string;
  emergency_contact: string;
  archived: boolean;
}

const DriverRegister = () => {
  const [operator, setOperator] = useState<Operator>({
    firstname: "",
    middlename: "",
    lastname: "",
    license_no: "",
    contact: "",
    region: "",
    city: "",
    brgy: "",
    street: "",
    type: "",
    dl_codes: [], // Initialize as an empty array of strings
    conditions: [], // Initialize as an empty array of strings
    expiration_date: "",
    emergency_name: "",
    emergency_address: "",
    emergency_contact: "",
    archived: false,
  });

  const [operatorList, setOperatorList] = useState<Operator[]>([]);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 8;
  const totalPages = Math.ceil(operatorList.length / rowsPerPage);
  const [isConfirmArchiveOpen, setIsConfirmArchiveOpen] = useState(false);
  const [isAlertVisible, setIsAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState(""); // State for alert message
  const [isRegisterAlertVisible, setIsRegisterAlertVisible] = useState(false); // State for register alert visibility
  const [operatorIdToArchive, setOperatorIdToArchive] = useState<number | null>(null);

  useEffect(() => {
    // Check if the current page has rows
    if (!hasRows(currentPage, rowsPerPage, operatorList) && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  }, [currentPage, rowsPerPage, operatorList]);

  // Function to check if the current page has rows
  const hasRows = (currentPage: number, rowsPerPage: number, data: Operator[]) => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return data.slice(startIndex, endIndex).length > 0;
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const currentRows = operatorList.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  useEffect(() => {
    setIsRegisterModalOpen(true);
  
    const fetchOperators = async () => {
      try {
        const response = await axios.get("/api/drivers");
        setOperatorList(response.data);
      } catch (error) {
        console.error("Failed to fetch operators:", error);
      }
    };

    fetchOperators();
  }, []);

  const handleRegisterModalClose = () => {
    setIsRegisterModalOpen(false);
  };

  const handleViewModalClose = () => {
    setIsViewModalOpen(false);
    setIsEditMode(false);
    setSelectedOperator(null);
  };

  const handleView = (operator: Operator) => {
    setSelectedOperator(operator);
    setIsViewModalOpen(true);
  };

  const handleEdit = () => {
    setIsEditMode(true);
  };

  const handleArchive = (operator: Operator) => {
    if (operator.id !== undefined) {
      setOperatorIdToArchive(operator.id);
    }
    setIsConfirmArchiveOpen(true);
  };

  const confirmArchiveUser = async () => {
    if (operatorIdToArchive === null) return;

    try {
      // Perform the archive request
      const response = await axios.delete(`/api/drivers`, {
        data: { id: operatorIdToArchive } // Include data if needed by your server
      });

      // Check the response status
      if (response.status === 200) {
        showAlert("User archived successfully"); // Show the alert
        setOperatorList((prev) =>
          prev.filter((op) => op.id !== operatorIdToArchive)
        );
        setIsConfirmArchiveOpen(false); // Close the confirmation dialog
      } else {
        console.error('Unexpected response status:', response.status);
        alert('Failed to archive operator');
      }
    } catch (error: any) {
      // Log error details
      console.error('Error during archive:', error.response?.data || error.message);
      alert('Failed to archive operator');
    }
  };

  const handleRegisterChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = event.target;
    if (name === 'dl_codes' || name === 'conditions') {
      setOperator(prevState => {
        const updatedArray = checked
          ? [...prevState[name as 'dl_codes' | 'conditions'], value]
          : prevState[name as 'dl_codes' | 'conditions'].filter(code => code !== value);
        return { ...prevState, [name]: updatedArray };
      });
    } else {
      setOperator((prevOperator) => ({
        ...prevOperator,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
  };

  const handleRegisterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await axios.post("/api/drivers", operator);
      setAlertMessage("Operator Registered Successfully"); // Set alert message
      setIsRegisterAlertVisible(true); // Show the register alert
      setTimeout(() => setIsRegisterAlertVisible(false), 3000); // Hide the alert after 3 seconds
      setOperator({
        firstname: "",
        middlename: "",
        lastname: "",
        license_no: "",
        contact: "",
        region: "",
        city: "",
        brgy: "",
        street: "",
        type: "",
        dl_codes: [], // Reset to empty array
        conditions: [], // Reset to empty array
        expiration_date: "",
        emergency_name: "",
        emergency_address: "",
        emergency_contact: "",
        archived: false,
      });
      const response = await axios.get("/api/drivers");
      setOperatorList(response.data);
      handleRegisterModalClose(); // Close the modal after successful submission
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 409) {
          alert("License number already registered");
        } else {
          alert("Failed to register operator");
        }
      }
    }
  };

  const Editdropdown = (e: ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSelectedOperator((prevState,) => ({
      ...prevState!,
      [name]: value,
    }));
  };

  const Registerdropdown = (event: ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = event.target;
    setOperator((prevOperator) => ({
      ...prevOperator,
      [name]: value,
    }));
  };

 

  const handleViewChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked } = event.target;
    if (name === 'dl_codes' || name === 'conditions') {
      setSelectedOperator(prevState => {
        if (!prevState) return prevState; // Ensure prevState is not null
        const updatedArray = checked
          ? [...prevState[name as keyof Operator] as string[], value]
          : (prevState[name as keyof Operator] as string[]).filter(item => item !== value);
        return { ...prevState, [name]: updatedArray };
      });
    } else {
      setSelectedOperator(prevState => {
        if (!prevState) return prevState; // Ensure prevState is not null
        return { ...prevState, [name]: value };
      });
    }
  };


  const handleViewSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedOperator) return;

    try {
      await axios.put(`/api/drivers/${selectedOperator.id}`, selectedOperator);
      showAlert("Operator updated successfully"); // Show the alert
      const response = await axios.get("/api/drivers");
      setOperatorList(response.data);
      handleViewModalClose(); // Close the modal after successful update
    } catch (error) {
      showAlert("Failed to update operator"); // Show the alert
    }
  };

  const showAlert = (message: string) => {
    setAlertMessage(message);
    setIsAlertVisible(true);
    setTimeout(() => setIsAlertVisible(false), 3000);
  };
  


  return (
    <div className="container mx-auto p-4 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-4">Register Operator</h1>
      <form onSubmit={handleRegisterSubmit} className="space-y-8 p-2 sm:p-2 w-full max-w-4xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2" style={{ marginBottom: '-1.2rem' }}>
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-900 uppercase">First Name</label>
            <input
              type="text"
              name="firstname"
              value={operator.firstname}
              onChange={handleRegisterChange}
              required
              className="bg-gray-50 border-2 border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 placeholder-gray-400 focus:border-green-600 focus:outline-none uppercase"
              placeholder="first name"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-900 uppercase">Middle Name</label>
            <input
              type="text"
              name="middlename"
              value={operator.middlename}
              onChange={handleRegisterChange}
              className="bg-gray-50 border-2 border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 placeholder-gray-400 focus:border-green-600 focus:outline-none uppercase"
              placeholder="middle name"
              required
            />
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-900 uppercase">Last Name</label>
            <input
              type="text"
              name="lastname"
              value={operator.lastname}
              onChange={handleRegisterChange}
              required
              className="bg-gray-50 border-2 border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 placeholder-gray-400 focus:border-green-600 focus:outline-none uppercase"
              placeholder="last name"
            />
          </div>

         
        </div>

           {/* EMERGENCY CONTACT  */}
       <div className="flex justify-between items-center pb-4 mb-4 rounded-t  border-b sm:mb-5 dark:border-gray-600">
          <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
        </div>

  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">


  <div className="">
  <label className="block mb-2 text-sm font-medium text-gray-900 uppercase">Contact Number</label>
  <input   type="text"   name="contact"  value={operator.contact}   onChange={handleRegisterChange} 
    onInput={(e) => { const target = e.target as HTMLInputElement; target.value = target.value.replace(/[^0-9]/g, '');
    }} maxLength={11} 
    required
    className="bg-gray-50 border-2 border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 placeholder-gray-400 focus:border-green-600 focus:outline-none uppercase" 
    placeholder="contact no." 
  />
</div>

      

    
      <div className="">
  <label className="block mb-2 text-sm font-medium text-gray-900 uppercase">Region</label>
  <select name="region" value={operator.region} onChange={Registerdropdown} required
    className="bg-gray-50 border-2 border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 placeholder-gray-400 focus:border-green-600 focus:outline-none uppercase">
    <option value="" disabled>Select Region</option>
    <option value="NCR">NCR</option>
    <option value="CAR">CAR</option>
    <option value="Region I">Region I</option>
    <option value="Region II">Region II</option>
    <option value="Region III">Region III</option>
    <option value="Region IV-A">Region IV-A</option>
    <option value="Region IV-B">Region IV-B</option>
    <option value="Region V">Region V</option>
    <option value="Region VI">Region VI</option>
    <option value="Region VII">Region VII</option>
    <option value="Region VIII">Region VIII</option>
    <option value="Region IX">Region IX</option>
    <option value="Region X">Region X</option>
    <option value="Region XI">Region XI</option>
    <option value="Region XII">Region XII</option>
    <option value="Region XIII">Region XIII</option>
    <option value="BARMM">BARMM</option>
  </select>
</div>
      <div className="">
        <label htmlFor="city" className="block mb-2 text-sm font-medium text-gray-900 uppercase">City</label>
        <select id="city" name="city" value={operator.city} onChange={Registerdropdown} 
          className="bg-gray-50 border-2 border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 placeholder-gray-400 focus:border-green-600 focus:outline-none uppercase">
          <option value="" disabled>Select City</option>
          <option value="General Santos">General Santos</option>
          <option value="Davao">Davao</option>
          <option value="Cotabato">Cotabato</option>
        </select>
      </div>
  
  <div className="">
        <label htmlFor="brgy" className="block mb-2 text-sm font-medium text-gray-900 uppercase">Barangay</label>
        <select id="brgy" name="brgy" value={operator.brgy} onChange={Registerdropdown}
          className="bg-gray-50 border-2 border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 placeholder-gray-400 focus:border-green-600 focus:outline-none uppercase">
          <option value="" disabled>Select Barangay</option>
          <option value="Barangay Apopong">Barangay Apopong</option>
          <option value="Barangay Baluan">Barangay Baluan</option>
          <option value="Barangay Bula">Barangay Bula</option>
          <option value="Barangay Buayan">Barangay Buayan</option>
          <option value="Barangay Calumpang">Barangay Calumpang</option>
          <option value="Barangay Dadiangas East">Barangay Dadiangas East</option>
        </select>
      </div>

  <div className="">
            <label className="block mb-2 text-sm font-medium text-gray-900 uppercase">Street</label>
            <input type="text" name="street" value={operator.street} onChange={handleRegisterChange} required
              className="bg-gray-50 border-2 border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 placeholder-gray-400 focus:border-green-600 focus:outline-none uppercase" placeholder="street name" />
          </div>  
  
  </div>

        <div className="flex justify-between items-center pb-4 mb-4 rounded-t border-b sm:mb-5 dark:border-gray-600">
          <h3 className="text-lg font-semibold text-gray-900">License Information</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-900 uppercase">License No</label>
            <input
              type="text"
              name="license_no"
              value={operator.license_no}
              onChange={handleRegisterChange}
              required
              className="bg-gray-50 border-2 border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 placeholder-gray-400 focus:border-green-600 focus:outline-none uppercase"
              placeholder="license no."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 mt-4">
  
<div className="">
    <label className="block mb-2 text-sm font-medium text-gray-900 uppercase">DL Codes</label>
    <div style={{width:'13.4rem'}}  
    className="bg-gray-50 border-2 border-gray-300
     text-gray-900 text-sm rounded-lg block  p-2.5 placeholder-gray-400
      uppercase">
      <div className="grid grid-cols-3 ">
        {dlOptions.map(option => (
          <div key={option} className="flex items-center mb-2">
            <input
              type="checkbox"
              name="dl_codes"
              value={option}
              checked={operator.dl_codes.includes(option)}
              onChange={handleRegisterChange}
              className="mr-2"
            />
            <label className="text-sm font-medium text-gray-900">{option}</label>
          </div>
        ))}
      </div>
    </div>
  </div>

  <div className="ml-[-14rem]">
    <label className="block mb-2 text-sm font-medium text-gray-900 uppercase ">Conditions</label>
    <div style={{width:'9rem'}}  
     className="bg-gray-50 border-2 border-gray-300
     text-gray-900 text-sm rounded-lg block w-96 p-2.5 placeholder-gray-400
       uppercase">
      <div className="grid grid-cols-3">
        {conditionOptions.map(option => (
          <div key={option} className="flex items-center mb-2 mr-4">
            <input
              type="checkbox"
              name="conditions"
              value={option}
              checked={operator.conditions.includes(option)}
              onChange={handleRegisterChange}
              className="mr-2"
            />
            <label className="text-sm font-medium text-gray-900">{option}</label>
          </div>
        ))}
      </div>
    </div>
  </div>
</div>

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-900 uppercase">Expiration Date</label>
            <input
              type="date"
              name="expiration_date"
              value={operator.expiration_date}
              onChange={handleRegisterChange}
              required
              className="bg-gray-50 border-2 border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 placeholder-gray-400 focus:border-green-600 focus:outline-none uppercase"
              placeholder="expiration date"
            />
          </div>
        </div>

        <div className="flex justify-between items-center pb-4 mb-4 rounded-t border-b sm:mb-5 dark:border-gray-600">
          <h3 className="text-lg font-semibold text-gray-900">Incase of emergency</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-900 uppercase">Contact Name</label>
            <input
              type="text"
              name="emergency_name"
              value={operator.emergency_name}
              onChange={handleRegisterChange}
              required
              className="bg-gray-50 border-2 border-gray-300 text-gray-900 text-sm rounded-lg block w-56 p-2.5 placeholder-gray-400 focus:border-green-600 focus:outline-none uppercase"
              placeholder="emergency name"
            />
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-900 uppercase" style={{ marginLeft: '-4.9rem' }}>
              Contact Address
            </label>
            <input
              type="text"
              name="emergency_address"
              value={operator.emergency_address}
              onChange={handleRegisterChange}
              required
              style={{ marginLeft: '-4.9rem' }}
              className="bg-gray-50 border-2 border-gray-300 text-gray-900 text-sm rounded-lg block w-56 p-2.5 placeholder-gray-400 focus:border-green-600 focus:outline-none uppercase"
              placeholder="emergency address"
            />
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-900 uppercase" style={{ marginLeft: '-9rem' }}>
              Contact Number
            </label>
            <input
              onInput={(e) => {
                const target = e.target as HTMLInputElement;
                target.value = target.value.replace(/[^0-9]/g, '');
              }}
              maxLength={11}
              type="tel"
              name="emergency_contact"
              value={operator.emergency_contact}
              onChange={handleRegisterChange}
              required
              style={{ marginLeft: '-9rem' }}
              className="bg-gray-50 border-2 border-gray-300 text-gray-900 text-sm rounded-lg block w-64 p-2.5 placeholder-gray-400 focus:border-green-600 focus:outline-none uppercase"
              placeholder="emergency contact number"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="submit"
            className="text-white inline-flex items-center bg-emerald-500 hover:bg-emerald-600 focus:ring-4 focus:ring-green-500 font-medium rounded-lg text-sm px-5 py-2.5"
          >
            Register Operator
          </button>
          <button type="button" onClick={handleRegisterModalClose} className="text-gray-700 bg-gray-200 hover:bg-gray-300 focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5">
        Cancel
      </button>
    </div>
  </form>


        
        
    </div>
  );
};

export default DriverRegister;