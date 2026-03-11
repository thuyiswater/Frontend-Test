'use client'
import React from 'react';
import styles from './test.module.css';

// Your Test Starts Here

type FilterStatus = 'All' | 'Active' | 'Completed';
type Priority = 'Low' | 'Medium' | 'High';

interface Task {
    id: string;
    title: string;
    priority: Priority;
    completed: boolean;
    createdAt: number;
}

export default function TaskManager(): JSX.Element {
    const [isClient, setIsClient] = React.useState(false);
    const [task, setTask] = React.useState<Task[]>([]);

    // Form state
    const [title, setTitle] = React.useState('');
    const [error, setError] = React.useState<string | null>(null);
    const [priority, setPriority] = React.useState<Priority>('Medium');
    // Filter and search state
    const [filter, setFilter] = React.useState<FilterStatus>('All');
    const [searchQuery, setSearchQuery] = React.useState('');

    // Edit state
    const [editingId, setEditingId] = React.useState<string | null>(null);
    const [editTitle, setEditTitle] = React.useState('');
    const [editPriority, setEditPriority] = React.useState<Priority>('Medium');
    
    // Persistence
    React.useEffect(() => {
        setIsClient(true);
        const savedTasks = localStorage.getItem('taskManager_tasks');
        if (savedTasks) {
            try {
                setTask(JSON.parse(savedTasks));
            } catch(err) {
                console.error('Failed to parse tasks from local storage')
            }
        }
    }, []);

    React.useEffect(() => {
        if (isClient) {
            localStorage.setItem('taskManager_tasks', JSON.stringify(task));
        }
    }, [task, isClient]);

    const handleAddTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (title.trim() === '')  {
            setError('Task title cannot be empty');
            return;
        }
        
        const newTask: Task = {
            id: crypto.randomUUID() ? crypto.randomUUID() : Date.now().toString(),
            title: title.trim(),
            priority,
            completed: false,
            createdAt: Date.now(),
        };

        setTask((prevTasks) => [...prevTasks, newTask]);
        setTitle('');
        setError(null);
    }  

    const handleToggleComplete = (id: string) => {
        setTask((prevTasks) =>
            prevTasks.map((task) =>
                task.id === id ? { ...task, completed: !task.completed } : task
            )
        );
    }

    const handleDeleteTask = (id: string) => {
        setTask((prevTasks) => prevTasks.filter((task) => task.id !== id));
    }

    // Edit task handlers
    const handleStartEdit = (task: Task) => {
        setEditingId(task.id);
        setEditTitle(task.title);
        setEditPriority(task.priority);
    }

    const handleSaveEdit = (id: string) => {
        if (editTitle.trim() === '') return;
        setTask((prev) => 
            prev.map((task) =>
                task.id === id ? { ...task, title: editTitle.trim(), priority: editPriority } : task
            )
        )
        setEditingId(null);
    }

    const handleCancelEdit = () => {
        setEditingId(null);
    }

    // Sorting and Filtering
    const processedTask = [...task]
        .sort((a, b) => {
            if (a.completed == b.completed) {
                return b.createdAt - a.createdAt;
            }
            return a.completed ? 1 : -1;
        })
        .filter((task) => {
            const matchesStatus = 
                filter === 'All' ||
                (filter === 'Active' && !task.completed)||
                (filter === 'Completed' && task.completed);
            
            const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
            
            return matchesStatus && matchesSearch;
        })

    return (
        <main className={styles.container}>
            <h1 className={styles.header}>Task Manager</h1>

            {/* Add Task Section */}
            <section aria-labelledby="add-task-heading">
                <h2 id="add-task-heading" className={styles.srOnly}>Add a new task</h2>
                <form onSubmit={handleAddTask} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <label htmlFor="new-task-title" className={styles.srOnly}>Task Title</label>
                        <input
                            id="new-task-title"
                            type="text"
                            placeholder="What needs to be done?"
                            value={title}
                            onChange={(e) => {
                                setTitle(e.target.value);
                                if (error) setError(null);
                            }}
                            className={styles.input}
                        />
                        
                        <label htmlFor="new-task-priority" className={styles.srOnly}>Priority</label>
                        <select
                            id="new-task-priority"
                            value={priority}
                            onChange={(e) => setPriority(e.target.value as Priority)}
                            className={styles.select}
                        >
                            <option value="Low">Low Priority</option>
                            <option value="Medium">Medium Priority</option>
                            <option value="High">High Priority</option>
                        </select>
                        
                        <button type="submit" className={styles.buttonPrimary}>
                            Add task
                        </button>
                    </div>
                    {error && <p className={styles.error} role="alert">{error}</p>}
                </form>
            </section>

            {/* Tools Section: Search & Filters */}
            <section aria-labelledby="task-tools-heading" className={styles.toolsSection}>
                <h2 id="task-tools-heading" className={styles.srOnly}>Task Filters and Search</h2>
                
                <div className={styles.searchGroup}>
                    <label htmlFor="search-tasks" className={styles.srOnly}>Search tasks</label>
                    <input
                        id="search-tasks"
                        type="search"
                        placeholder="Search tasks by title..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>

                <div className={styles.filterGroup} role="group" aria-label="Filter tasks by status">
                    {(['All', 'Active', 'Completed'] as FilterStatus[]).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            aria-pressed={filter === f}
                            className={`${styles.filterBtn} ${filter === f ? styles.filterBtnActive : ''}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </section>

            {/* Task List Section */}
            <section aria-labelledby="task-list-heading">
                <h2 id="task-list-heading" className={styles.srOnly}>Your Tasks</h2>
                <ul className={styles.taskList}>
                    {!isClient ? (
                        <li className={styles.emptyState}>Loading tasks...</li>
                    ) : processedTask.length === 0 ? (
                        <li className={styles.emptyState}>No matching tasks found.</li>
                    ) : (
                        processedTask.map((task) => (
                            <li
                                key={task.id}
                                className={`${styles.taskItem} ${task.completed ? styles.taskItemCompleted : ''}`}
                            >
                                {editingId === task.id ? (
                                    // Edit Mode UI
                                    <div className={styles.editMode}>
                                        <div className={styles.editInputs}>
                                            <label htmlFor={`edit-title-${task.id}`} className={styles.srOnly}>Edit Task Title</label>
                                            <input
                                                id={`edit-title-${task.id}`}
                                                type="text"
                                                value={editTitle}
                                                onChange={(e) => setEditTitle(e.target.value)}
                                                className={styles.input}
                                                autoFocus
                                            />
                                            
                                            <label htmlFor={`edit-priority-${task.id}`} className={styles.srOnly}>Edit Task Priority</label>
                                            <select
                                                id={`edit-priority-${task.id}`}
                                                value={editPriority}
                                                onChange={(e) => setEditPriority(e.target.value as Priority)}
                                                className={styles.select}
                                            >
                                                <option value="Low">Low</option>
                                                <option value="Medium">Medium</option>
                                                <option value="High">High</option>
                                            </select>
                                        </div>
                                        <div className={styles.editActions}>
                                            <button onClick={() => handleSaveEdit(task.id)} className={styles.buttonSuccess}>Save</button>
                                            <button onClick={handleCancelEdit} className={styles.buttonGhost}>Cancel</button>
                                        </div>
                                    </div>
                                ) : (
                                    // Display Mode UI
                                    <>
                                        <div className={styles.taskInfo}>
                                            <div className={styles.checkboxWrapper}>
                                                <input
                                                    id={`task-toggle-${task.id}`}
                                                    type="checkbox"
                                                    checked={task.completed}
                                                    onChange={() => handleToggleComplete(task.id)}
                                                    className={styles.checkbox}
                                                    aria-label={`Mark "${task.title}" as ${task.completed ? 'active' : 'completed'}`}
                                                />
                                            </div>
                                            <label htmlFor={`task-toggle-${task.id}`} className={task.completed ? styles.taskTitleCompleted : styles.taskTitle}>
                                                {task.title}
                                            </label>
                                            <span className={`${styles.priorityBadge} ${
                                                task.completed ? styles.priorityCompleted :
                                                task.priority === 'High' ? styles.priorityHigh :
                                                task.priority === 'Medium' ? styles.priorityMedium :
                                                styles.priorityLow
                                            }`}>
                                                {task.priority}
                                            </span>
                                        </div>
                                        <div className={styles.taskActions}>
                                            <button onClick={() => handleStartEdit(task)} className={styles.editBtn} aria-label={`Edit ${task.title}`}>
                                                Edit
                                            </button>
                                            <button onClick={() => handleDeleteTask(task.id)} className={styles.deleteBtn} aria-label={`Delete ${task.title}`}>
                                                Delete
                                            </button>
                                        </div>
                                    </>
                                )}
                            </li>
                        ))
                    )}
                </ul>
            </section>
        </main>
    );
}