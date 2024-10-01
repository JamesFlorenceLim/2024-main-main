"use client";
import { useEffect, useState } from 'react';
import axios from 'axios';

const fetchAssignments = async (status: string, terminal: string) => {
  const response = await axios.get(`/api/scheduling?terminal=${terminal}&status=${status}`);
  return response.data;
};

const fetchIdleAssignments = async (terminal: string) => {
  const response = await axios.get(`/api/scheduling?terminal=${terminal}&status=idle`);
  return response.data;
};

const updateAssignment = async (id: number, status: string, terminal: string, order?: number, arrivalTime?: string, departureTime?: string) => {
  await axios.put('/api/scheduling', { id, status, terminal, order, arrivalTime, departureTime });
};

const Terminal1 = () => {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [idleAssignments, setIdleAssignments] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('queued');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [countdownAssignmentId, setCountdownAssignmentId] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState<string>(new Date().toLocaleTimeString());

  useEffect(() => {
    const loadAssignments = async () => {
      const data = await fetchAssignments(statusFilter, 'terminal1');
      data.sort((a: any, b: any) => a.queue_order - b.queue_order); // Sort by queue_order
      setAssignments(data);
    };

    const loadIdleAssignments = async () => {
      const data = await fetchIdleAssignments('terminal1');
      data.sort((a: any, b: any) => a.queue_order - b.queue_order); // Sort by queue_order
      setIdleAssignments(data);
    };

    loadAssignments();
    loadIdleAssignments();
    const intervalId = setInterval(() => {
      loadAssignments();
      loadIdleAssignments();
    }, 5000);

    return () => clearInterval(intervalId);
  }, [statusFilter]);

  useEffect(() => {
    if (assignments.length > 0 && assignments[0].status === 'queued' && assignments[0].id !== countdownAssignmentId) {
      setCountdown(60);
      setCountdownAssignmentId(assignments[0].id);
    }
  }, [assignments]);

  useEffect(() => {
    if (countdown === null) return;

    if (countdown === 0) {
      if (assignments[0] && assignments[0].id === countdownAssignmentId) {
        handleStatusChange(assignments[0].id, 'departed');
      }
    } else {
      const timerId = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timerId);
    }
  }, [countdown, assignments]);

  useEffect(() => {
    const timeIntervalId = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);

    return () => clearInterval(timeIntervalId);
  }, []);

  const handleStatusChange = async (id: number, newStatus: string) => {
    const currentTerminal = 'terminal1';
    const currentTime = new Date();

    try {
      if (newStatus === 'queued') {
        const assignmentsData = await fetchAssignments('queued', currentTerminal);
        const nextOrder = assignmentsData.length + 1;

        await updateAssignment(id, 'queued', currentTerminal, nextOrder);
      } else if (newStatus === 'departed') {
        const assignmentsData = await fetchAssignments('queued', currentTerminal);
        const firstInQueueId = assignmentsData.length > 0 ? assignmentsData[0].id : null;

        if (id !== firstInQueueId) {
          alert('Only the first van in the queue can be marked as departed.');
          return;
        }

        // Set the departure time to current time
        const departureTime = currentTime.toLocaleTimeString();

        // Calculate the arrival time 3 hours later
        const arrivalTime = new Date(currentTime);
        arrivalTime.setHours(currentTime.getHours() + 3); // Add 3 hours

        await updateAssignment(id, 'departed', currentTerminal, undefined, arrivalTime.toLocaleTimeString(), departureTime);

        // Wait for 5 seconds before changing status to idle in the new terminal
        setTimeout(async () => {
          await updateAssignment(id, 'idle', 'terminal2');
          const data = await fetchAssignments(statusFilter, currentTerminal);
          setAssignments(data);
        }, 60000);
      } else if (newStatus === 'arrived') {
        await updateAssignment(id, 'arrived', currentTerminal, undefined, currentTime.toLocaleTimeString());
      } else {
        await updateAssignment(id, newStatus, currentTerminal);
      }

      const data = await fetchAssignments(statusFilter, currentTerminal);
      setAssignments(data);
    } catch (error) {
      console.error('Error changing status:', error);
    }
  };

  const handleImmediateArrival = async (id: number) => {
    const currentTerminal = 'terminal1';
    const currentTime = new Date().toLocaleTimeString();
    
    // Immediately set the status to arrived with the current time
    await updateAssignment(id, 'arrived', currentTerminal, undefined, currentTime);

    const data = await fetchAssignments(statusFilter, currentTerminal);
    setAssignments(data);
  };

  const getDestination = (terminal: string) => {
    switch (terminal) {
      case 'terminal1':
        return 'Palimbang Terminal';
      case 'terminal2':
        return 'Gensan Terminal';
      default:
        return 'Unknown Destination';
    }
  };

  return (
    <div className="p-6 ">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Gensan Terminal</h1>
      <div className="text-center mb-6">
        <span className="text-xl font-semibold text-gray-700">Current Time: {currentTime}</span>
      </div>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">Idle Vans</h2>
        <ul className="bg-white shadow-md rounded-lg divide-y divide-gray-200">
          {idleAssignments.map((assignment: any) => (
            <li key={assignment.id} className="p-4 flex justify-between items-center text-center">
              <span className="font-medium text-gray-900">
                Driver: {assignment.Driver.firstname} {assignment.Driver.lastname} - Plate Number: {assignment.Van.plate_number} - Status: {assignment.status}
              </span>
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                onClick={() => handleStatusChange(assignment.id, 'queued')}
              >
                Queue
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">Other Statuses</h2>
        <div className="mb-4 flex space-x-4 justify-center">
          <button
            className={`px-4 py-2 rounded-lg font-semibold ${statusFilter === 'queued' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            onClick={() => setStatusFilter('queued')}
          >
            Show Queued
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-semibold ${statusFilter === 'departed' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            onClick={() => setStatusFilter('departed')}
          >
            Show Departed
          </button>
        </div>
        <ul className="bg-white shadow-md rounded-lg divide-y divide-gray-200">
          {assignments.map((assignment: any) => (
            <li key={assignment.id} className="p-4 flex flex-col md:flex-row justify-between items-center text-center">
              <span className="font-medium text-gray-900">
                Driver: {assignment.Driver.firstname} {assignment.Driver.lastname} - Plate Number: {assignment.Van.plate_number} - Status: {assignment.status} - Destination: {getDestination('terminal1')}
              </span>
              <div className="flex space-x-2 mt-2 md:mt-0">
                <button
                  className="bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600"
                  onClick={() => handleStatusChange(assignment.id, 'queued')}
                >
                  Queue
                </button>
                <button
                  className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600"
                  onClick={() => handleStatusChange(assignment.id, 'departed')}
                >
                  Depart
                </button>
                {assignment.status === 'departed' && (
                  <button
                    className="bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600"
                    onClick={() => handleImmediateArrival(assignment.id)}
                  >
                    Arrive Immediately
                  </button>
                )}
              </div>
              {assignment.arrivalTime && (
                <span className="ml-4 text-green-500 font-bold">Arrived at: {assignment.arrivalTime}</span>
              )}
              {assignment.departureTime && (
                <span className="ml-4 text-blue-500 font-bold">Departed at: {assignment.departureTime}</span>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default Terminal1;
