"use client";
import { useEffect, useState } from "react";
import { Van, Assignment, Driver } from "@/types";

export default function VanDriverAssignment() {
  const [vans, setVans] = useState<Assignment[]>([]); // All vans with assignments
  const [availableVans, setAvailableVans] = useState([]); // Vans for new assignment
  const [drivers, setDrivers] = useState([]); // Available drivers
  const [selectedVan, setSelectedVan] = useState(null); // For editing existing assignment
  const [selectedDriver, setSelectedDriver] = useState(""); // Driver for modal
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewAssignmentModal, setShowNewAssignmentModal] = useState(false); // State to control new assignment modal
  const [searchVanTerm, setSearchVanTerm] = useState(""); // State for searching vans
  const [selectedVanForNewAssignment, setSelectedVanForNewAssignment] = useState(null); // Single van selection for new assignment

  // Fetch all vans and drivers
  useEffect(() => {
    // Fetch assignments to show existing assignments
    fetch("/api/assignments")
      .then((response) => response.json())
      .then((data) => setVans(data))
      .catch((error) => console.error("Error fetching assignments:", error));

    // Fetch available drivers
    fetch("/api/drivers")
      .then((response) => response.json())
      .then((data) => setDrivers(data))
      .catch((error) => console.error("Error fetching drivers:", error));

    // Fetch available vans for new assignment
    fetch("/api/vans")
      .then((response) => response.json())
      .then((data) => setAvailableVans(data))
      .catch((error) => console.error("Error fetching available vans:", error));
  }, []);

  // Filter vans based on operator search
  const filteredVans = vans.filter((assignment) => {
    const operatorName = `${assignment.Van.Operator?.firstname} ${assignment.Van.Operator?.lastname}`.toLowerCase();
    return operatorName.includes(searchTerm.toLowerCase());
  });

  // Filter available vans based on search term for new assignment
  const filteredAvailableVans = availableVans.filter((van) => {
    return (
      van.plate_number.toLowerCase().includes(searchVanTerm.toLowerCase()) &&
      !vans.some((assignment) => assignment.Driver && assignment.Van.id === van.id)
    );
  });

  // Filter available drivers based on those who are not currently assigned
  const filteredAvailableDrivers = drivers.filter(driver => {
    return !vans.some(assignment => assignment.Driver?.id === driver.id);
  });

  // Open modal for assigning driver
  const handleOpenModal = (van) => {
    setSelectedVan(van);
    setSelectedDriver(van.Driver?.id || ""); // Set driver for the modal
  };

  // Handle modal driver assignment
  const handleDriverSelection = (driverId) => {
    setSelectedDriver(driverId);
  };

  // Handle modal submission to update driver
  const handleModalSubmit = async () => {
    try {
      const response = await fetch("/api/assignments", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: selectedVan.id,
          van_ids: [selectedVan.Van.id],
          driver_id: selectedDriver ? parseInt(selectedDriver) : null, // Handle removing driver by passing null
        }),
      });

      if (response.ok) {
        alert(selectedDriver ? "Driver assigned successfully" : "Driver removed successfully");
        setSelectedVan(null); // Close modal
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message}`);
      }
    } catch (error) {
      console.error("Error assigning/removing driver:", error);
    }
  };

  // Handle opening new assignment modal
  const handleOpenNewAssignmentModal = () => {
    setShowNewAssignmentModal(true);
    setSelectedDriver(""); // Reset selected driver for new assignment
    setSelectedVanForNewAssignment(null); // Reset selected van for new assignment
  };

  // Handle submission for new assignment
  const handleNewAssignmentSubmit = async () => {
    if (!selectedDriver || !selectedVanForNewAssignment) {
      alert("Please select both a driver and a van.");
      return;
    }

    try {
      const response = await fetch("/api/assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          driver_id: parseInt(selectedDriver),
          van_ids: [selectedVanForNewAssignment],
        }),
      });

      if (response.ok) {
        alert("New assignment created successfully");
        setShowNewAssignmentModal(false); // Close modal
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message}`);
      }
    } catch (error) {
      console.error("Error creating new assignment:", error);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Van and Driver Assignment</h1>

      {/* Search Bar for Operators */}
      <input
        type="text"
        placeholder="Search by Operator"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-4 px-4 py-2 border rounded-md w-full"
      />

      {/* New Assignment Button */}
      <button
        className="bg-green-500 text-white px-4 py-2 rounded-md mb-4"
        onClick={handleOpenNewAssignmentModal}
      >
        Register New Assignment
      </button>

      {/* Table */}
      <table className="table-auto w-full bg-white shadow-md rounded-lg">
        <thead>
          <tr className="bg-gray-200">
            <th className="px-4 py-2">Van Plate No.</th>
            <th className="px-4 py-2">Operator</th>
            <th className="px-4 py-2">Driver</th>
            <th className="px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredVans.map((assignment) => (
            <tr key={assignment.id} className="border-t">
              <td className="px-4 py-2">{assignment.Van.plate_number.toUpperCase()}</td>
              <td className="px-4 py-2">
              {assignment.Van.Operator?.firstname.toUpperCase()} {assignment.Van.Operator?.lastname.toUpperCase()}
              </td>
              <td className="px-4 py-2">
              {assignment.Driver
                ? `${assignment.Driver.firstname.toUpperCase()} ${assignment.Driver.lastname.toUpperCase()}`
                : "NO DRIVER ASSIGNED"}
              </td>
              <td className="px-4 py-2">
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded-md"
                onClick={() => handleOpenModal(assignment)}
              >
                ASSIGN/EDIT DRIVER
              </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal for Assigning Driver */}
      {selectedVan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-md shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {selectedDriver ? `Edit Driver for ${selectedVan.Van.plate_number}` : `Assign Driver for ${selectedVan.Van.plate_number}`}
            </h2>

            <label htmlFor="driver-select" className="block mb-2">
              Select Driver:
            </label>
            <select
              id="driver-select"
              value={selectedDriver}
              onChange={(e) => handleDriverSelection(e.target.value)}
              className="block w-full mb-4 px-4 py-2 border rounded-md"
            >
              <option value="">Select a driver</option>
              {/* Option to remove driver */}
              {filteredAvailableDrivers.map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.firstname} {driver.lastname}
                </option>
              ))}
            </select>

            {/* Optional: Remove Driver Button */}
            <button
              className="bg-red-500 text-white px-4 py-2 rounded-md mb-4"
              onClick={() => handleDriverSelection(null)}
            >
              Remove Driver
            </button>

            <div className="flex justify-end">
              <button
                className="bg-green-500 text-white px-4 py-2 rounded-md mr-2"
                onClick={handleModalSubmit}
              >
                Save
              </button>
              <button
                className="bg-red-500 text-white px-4 py-2 rounded-md"
                onClick={() => setSelectedVan(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for New Assignment */}
      {showNewAssignmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-md shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Register New Assignment</h2>

            <label htmlFor="van-select" className="block mb-2">
              Select Van:
            </label>
            <input
              type="text"
              placeholder="Search Van by Plate No."
              value={searchVanTerm}
              onChange={(e) => setSearchVanTerm(e.target.value)}
              className="mb-4 px-4 py-2 border rounded-md w-full"
            />
            <select
              id="van-select"
              value={selectedVanForNewAssignment}
              onChange={(e) => setSelectedVanForNewAssignment(e.target.value)}
              className="block w-full mb-4 px-4 py-2 border rounded-md"
            >
              <option value="">Select a van</option>
              {filteredAvailableVans.map((van) => (
              <option key={van.id} value={van.id}>
                {van.plate_number.toUpperCase()} - {van.Operator?.firstname.toUpperCase()} {van.Operator?.lastname.toUpperCase()}
              </option>
              ))}
            </select>

            <label htmlFor="driver-select" className="block mb-2">
              Select Driver:
            </label>
            <select
              id="driver-select"
              value={selectedDriver}
              onChange={(e) => setSelectedDriver(e.target.value)}
              className="block w-full mb-4 px-4 py-2 border rounded-md"
            >
              <option value="">Select a driver</option>
              {filteredAvailableDrivers.map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.firstname} {driver.lastname}
                </option>
              ))}
            </select>

            <div className="flex justify-end">
              <button
                className="bg-green-500 text-white px-4 py-2 rounded-md mr-2"
                onClick={handleNewAssignmentSubmit}
              >
                Save
              </button>
              <button
                className="bg-red-500 text-white px-4 py-2 rounded-md"
                onClick={() => setShowNewAssignmentModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

