"use client";
import { useState } from 'react';
import OperatorRegister from '../operators/OperatorRegister';
import DriverRegister from './DriverRegister';
import DriverForm from './DriverForm';
import OperatorForm from '../operators/OperatorForm';
import DriverList from './DriverList';
import OperatorList from '../operators/OperatorList';
import Modal from './Modal';

const OperatorsPage = () => {
  const [formType, setFormType] = useState("operator"); // To control which form to show
  const [isModalOpen, setIsModalOpen] = useState(false); // Modal state

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  // Handle form switch based on dropdown value
  const handleFormChange = (e) => {
    setFormType(e.target.value);
  };

  return (
    <div className=''>
      {/* Button to open modal */}
      <button onClick={openModal} className="mt-4 p-2 bg-blue-500 text-white border-black ml-[85rem]">
        Register
      </button>

      {/* Modal Component */}
      {isModalOpen && (
        <Modal isOpen={isModalOpen} title="Register Form" onClose={closeModal}>
          {/* Dropdown to select form */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Register Form</label>
            <select
              value={formType}
              onChange={handleFormChange}
              className="block w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="operator">Operator</option>
              <option value="driver">Driver</option>
            </select>
          </div>

          {/* Render form based on the selected option */}
          {formType === "operator" ? <OperatorRegister /> : <DriverRegister />}

          
          <div className="flex justify-end space-x-4">
      <button onClick={closeModal} className="text-white inline-flex items-center bg-emerald-500 hover:bg-emerald-600 focus:ring-4 focus:ring-green-500 font-medium rounded-lg text-sm px-5 py-2.5">
        Cancel
      </button>
      
      
    </div>
        </Modal>
      )}

      
        
        <OperatorList/>
        
        <DriverList/>

    </div>
  );
}

export default OperatorsPage;
