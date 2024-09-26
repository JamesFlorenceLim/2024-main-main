"use client";

import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import axios from "axios";
import Modal from "./Modal"; // Import the Modal component
import { Operator } from "@/types";

const OperatorRegister = () => {
  const [operator, setOperator] = useState({
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
    dl_codes: "",
    conditions: "",
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
    const fetchOperators = async () => {
      try {
        const response = await axios.get("/api/operators");
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
    setOperatorIdToArchive(operator.id);
    setIsConfirmArchiveOpen(true);
  };

  const confirmArchiveUser = async () => {
    if (operatorIdToArchive === null) return;

    try {
      // Perform the archive request
      const response = await axios.delete(`/api/operators`, {
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
    setOperator((prevOperator) => ({
      ...prevOperator,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleRegisterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await axios.post("/api/operators", operator);
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
        dl_codes: "",
        conditions: "",
        expiration_date: "",
        emergency_name: "",
        emergency_address: "",
        emergency_contact: "",
        archived: false,
      });
      const response = await axios.get("/api/operators");
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

  const handleViewChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (selectedOperator) {
      const { name, value } = e.target;
      setSelectedOperator((prev) => ({
        ...prev!,
        [name]: value,
      }));
    }
  };

  const handleViewSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedOperator) return;

    try {
      await axios.put(`/api/operators/${selectedOperator.id}`, selectedOperator);
      showAlert("Operator updated successfully"); // Show the alert
      const response = await axios.get("/api/operators");
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
  <h2 className="text-xl font-semibold mb-4">Register Operator</h2>
  
  <form onSubmit={handleRegisterSubmit} className="space-y-8 p-2 sm:p-2">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2" style={{ marginBottom: '-1.2rem' }}>
      <div>
        <label className="block mb-2 text-sm font-medium text-gray-900 uppercase">First Name</label>
        <input type="text" name="firstname" value={operator.firstname} onChange={handleRegisterChange} required
          className="bg-gray-50 border-2 border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 placeholder-gray-400 focus:border-green-600 focus:outline-none uppercase" 
          placeholder="First Name" />
      </div>
      <div>
        <label className="block mb-2 text-sm font-medium text-gray-900 uppercase">Middle Name</label>
        <input type="text" name="middlename" value={operator.middlename} onChange={handleRegisterChange} required
          className="bg-gray-50 border-2 border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 placeholder-gray-400 focus:border-green-600 focus:outline-none uppercase" 
          placeholder="Middle Name" />
      </div>
      <div>
        <label className="block mb-2 text-sm font-medium text-gray-900 uppercase">Last Name</label>
        <input type="text" name="lastname" value={operator.lastname} onChange={handleRegisterChange} required
          className="bg-gray-50 border-2 border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 placeholder-gray-400 focus:border-green-600 focus:outline-none uppercase" 
          placeholder="Last Name" />
      </div>
    </div>

    {/* Contact Information Section */}
    <div className="flex justify-between items-center pb-4 mb-4 rounded-t border-b sm:mb-5">
      <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div>
        <label className="block mb-2 text-sm font-medium text-gray-900 uppercase">Contact Number</label>
        <input type="text" name="contact" value={operator.contact} onChange={handleRegisterChange}
          onInput={(e) => { const target = e.target as HTMLInputElement; target.value = target.value.replace(/[^0-9]/g, ''); }}
          maxLength={11} required
          className="bg-gray-50 border-2 border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 placeholder-gray-400 focus:border-green-600 focus:outline-none uppercase" 
          placeholder="Contact No." />
      </div>

      <div>
        <label className="block mb-2 text-sm font-medium text-gray-900 uppercase">Region</label>
        <select name="region" value={operator.region} onChange={Registerdropdown} required
          className="bg-gray-50 border-2 border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 placeholder-gray-400 focus:border-green-600 focus:outline-none uppercase">
          <option value="" disabled>Select Region</option>
          <option value="NCR">NCR</option>
          {/* Add other regions */}
        </select>
      </div>

      <div>
        <label className="block mb-2 text-sm font-medium text-gray-900 uppercase">City</label>
        <select name="city" value={operator.city} onChange={Registerdropdown}
          className="bg-gray-50 border-2 border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 placeholder-gray-400 focus:border-green-600 focus:outline-none uppercase">
          <option value="" disabled>Select City</option>
          <option value="General Santos">General Santos</option>
          {/* Add other cities */}
        </select>
      </div>

      <div>
        <label className="block mb-2 text-sm font-medium text-gray-900 uppercase">Barangay</label>
        <select name="brgy" value={operator.brgy} onChange={Registerdropdown}
          className="bg-gray-50 border-2 border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 placeholder-gray-400 focus:border-green-600 focus:outline-none uppercase">
          <option value="" disabled>Select Barangay</option>
          <option value="Barangay Apopong">Barangay Apopong</option>
          {/* Add other barangays */}
        </select>
      </div>

      <div>
        <label className="block mb-2 text-sm font-medium text-gray-900 uppercase">Street</label>
        <input type="text" name="street" value={operator.street} onChange={handleRegisterChange} required
          className="bg-gray-50 border-2 border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 placeholder-gray-400 focus:border-green-600 focus:outline-none uppercase" 
          placeholder="Street Name" />
      </div>
    </div>

    {/* Emergency Contact Section */}
    <div className="flex justify-between items-center pb-4 mb-4 rounded-t border-b sm:mb-5">
      <h3 className="text-lg font-semibold text-gray-900">In Case of Emergency</h3>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div>
        <label className="block mb-2 text-sm font-medium text-gray-900 uppercase">Emergency Contact Name</label>
        <input type="text" name="emergency_name" value={operator.emergency_name} onChange={handleRegisterChange} required
          className="bg-gray-50 border-2 border-gray-300 text-gray-900 text-sm rounded-lg block w-56 p-2.5 placeholder-gray-400 focus:border-green-600 focus:outline-none uppercase" 
          placeholder="Emergency Contact Name" />
      </div>

      <div>
        <label className="block mb-2 text-sm font-medium text-gray-900 uppercase">Emergency Contact Address</label>
        <input type="text" name="emergency_address" value={operator.emergency_address} onChange={handleRegisterChange} required
          className="bg-gray-50 border-2 border-gray-300 text-gray-900 text-sm rounded-lg block w-56 p-2.5 placeholder-gray-400 focus:border-green-600 focus:outline-none uppercase" 
          placeholder="Emergency Contact Address" />
      </div>

      <div>
        <label className="block mb-2 text-sm font-medium text-gray-900 uppercase">Emergency Contact Number</label>
        <input type="tel" name="emergency_contact" value={operator.emergency_contact} onChange={handleRegisterChange}
          onInput={(e) => { const target = e.target as HTMLInputElement; target.value = target.value.replace(/[^0-9]/g, ''); }} maxLength={11} required
          className="bg-gray-50 border-2 border-gray-300 text-gray-900 text-sm rounded-lg block w-64 p-2.5 placeholder-gray-400 focus:border-green-600 focus:outline-none uppercase" 
          placeholder="Emergency Contact Number" />
      </div>
    </div>
      
    <div className="flex justify-end space-x-4">
      <button type="submit" className="text-white inline-flex items-center bg-emerald-500 hover:bg-emerald-600 focus:ring-4 focus:ring-green-500 font-medium rounded-lg text-sm px-5 py-2.5">
        Register Operator
      </button>
      
    </div>
  </form>

        
        
    </div>
  );
};

export default OperatorRegister;