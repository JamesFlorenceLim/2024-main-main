"use client";

import { useState, useEffect } from 'react';

function AssignmentForm() {
  const [operators, setOperators] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vans, setVans] = useState([]);
  const [availableVans, setAvailableVans] = useState([]);
  const [selectedOperator, setSelectedOperator] = useState(null);
  const [assignments, setAssignments] = useState({}); // For van-driver assignments

  useEffect(() => {
    // Fetch operators and drivers from backend when component loads
    fetch('/api/operators')
      .then((res) => res.json())
      .then(setOperators)
      .catch((err) => console.error('Error fetching operators:', err));

    fetch('/api/drivers')
      .then((res) => res.json())
      .then(setDrivers)
      .catch((err) => console.error('Error fetching drivers:', err));

    // Fetch all vans
    fetch('/api/vans')
      .then((res) => res.json())
      .then((vansData) => {
        setVans(vansData); // Store all vans

        // Check assignments to filter available vans
        return fetch('/api/assignments');
      })
      .then((res) => res.json())
      .then((assignmentsData) => {
        const assignedVanIds = assignmentsData.map(a => a.van_id); // Get assigned van IDs
        const available = vans.filter(van => !assignedVanIds.includes(van.id)); // Filter available vans
        setAvailableVans(available);
      })
      .catch((err) => console.error('Error fetching vans or assignments:', err));
  }, []);

  const handleOperatorChange = (event) => {
    setSelectedOperator(event.target.value);
  };

  const assignOperatorToVan = async (vanId) => {
    try {
      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operator_id: selectedOperator,
          van_ids: [vanId], // Single van assignment
        }),
      });

      if (response.ok) {
        const updatedAssignments = await response.json();

        // Remove the van from availableVans after assigning an operator
        setAvailableVans((prev) => prev.filter((van) => van.id !== vanId));

        // Update the vans state to include the newly assigned van
        setVans((prev) => [...prev, ...updatedAssignments]);
      } else {
        console.error('Failed to assign operator.');
      }
    } catch (error) {
      console.error('Error assigning operator:', error);
    }
  };

  const handleDriverChange = (vanId, event) => {
    const driverId = event.target.value;
    setAssignments((prev) => ({
      ...prev,
      [vanId]: driverId,
    }));
  };

  const assignDriverToVan = async (vanId) => {
    const driverId = assignments[vanId];

    if (!driverId) return;

    try {
      const response = await fetch('/api/assignments/assignDriver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignment_id: vanId, // Assuming this corresponds to the van's assignment record
          driver_id: driverId,
        }),
      });

      if (response.ok) {
        const updatedAssignment = await response.json();
        // Update van list with assigned driver
        setVans((prev) =>
          prev.map((van) =>
            van.id === vanId ? { ...van, driver_id: driverId } : van
          )
        );
      } else {
        console.error('Failed to assign driver.');
      }
    } catch (error) {
      console.error('Error assigning driver:', error);
    }
  };

  const getAvailableDrivers = () => {
    return drivers.filter(
      (driver) => !vans.some((van) => van.driver_id === driver.id)
    );
  };

  return (
    <div>
      <h3>Assign Operator to Available Vans</h3>
      <select onChange={handleOperatorChange}>
        <option value="">Select Operator</option>
        {operators.map((operator) => (
          <option key={operator.id} value={operator.id}>
            {operator.firstname} {operator.lastname}
          </option>
        ))}
      </select>

      <div>
        <h4>Available Vans:</h4>
        {availableVans.length > 0 ? (
          availableVans.map((van) => (
            <div key={van.id}>
              <span>{van.plate_number}</span>
              <button onClick={() => assignOperatorToVan(van.id)}>
                Assign Operator
              </button>
            </div>
          ))
        ) : (
          <p>All vans have operators assigned.</p>
        )}
      </div>

      <h3>Assign Drivers to Vans with Operators</h3>
      <table>
        <thead>
          <tr>
            <th>Van</th>
            <th>Operator</th>
            <th>Driver</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {vans
            .filter((assignment) => assignment.operator_id) // Only show vans that have an operator
            .map((assignment) => (
              <tr key={assignment.id}>
                <td>{assignment.plate_number}</td>
                <td>
                  {operators.find(
                    (operator) => operator.id === assignment.operator_id
                  )?.firstname}{' '}
                  {operators.find(
                    (operator) => operator.id === assignment.operator_id
                  )?.lastname}
                </td>
                <td>
                  {drivers.find(
                    (driver) => driver.id === assignment.driver_id
                  )
                    ? `${drivers.find(
                        (driver) => driver.id === assignment.driver_id
                      )?.firstname} ${drivers.find(
                        (driver) => driver.id === assignment.driver_id
                      )?.lastname}`
                    : 'No driver assigned'}
                </td>
                <td>
                  <select
                    onChange={(event) => handleDriverChange(assignment.id, event)}
                    value={assignments[assignment.id] || ''}
                  >
                    <option value="">Select Driver</option>
                    {getAvailableDrivers().map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        {driver.firstname} {driver.lastname}
                      </option>
                    ))}
                  </select>
                  <button onClick={() => assignDriverToVan(assignment.id)}>
                    Assign Driver
                  </button>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

export default AssignmentForm;
