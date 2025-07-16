import React, { useState } from 'react'
import ResponsiveLayout from '../components/layout/ResponsiveLayout'
import { Plus } from 'lucide-react';
import CreateGroupModal from '../components/layout/CreateGroupModal';

const Aside = ({
  activeTab, setActiveTab, view, setView, setIsModalActive
}) => {
  return (
    <div className='w-full h-screen flex flex-col items-center
    bg-light-200 text-light-txt dark:bg-dark-200 dark:text-dark-txt'>
      {/* tabs */}
      <div className='flex items-center justify-between w-full gap-1'>
        <div title='Groups' className={`flex-1 py-3 text-sm font-outfit font-medium text-center cursor-pointer border-b-2
          ${activeTab == "groups" ? 'text-primary border-primary border-b-4' : 
            'text-light-txt dark:text-dark-txt border-light-txt dark:border-dark-txt hover:text-light-txt2 dark:hover:text-dark-txt2 hover:border-light-txt2 dark:hover:border-dark-txt2'
          }`}
          onClick={() => setActiveTab("groups")}
        >
          Groups
        </div>
        <div title='Sent Requests' className={`flex-1 py-3 text-sm font-outfit font-medium text-center cursor-pointer border-b-2 truncate
          ${activeTab == "requests" ? 'text-primary border-primary border-b-4' : 
            'text-light-txt dark:text-dark-txt border-light-txt dark:border-dark-txt hover:text-light-txt2 dark:hover:text-dark-txt2 hover:border-light-txt2 dark:hover:border-dark-txt2'
          }`}
          onClick={() => setActiveTab("requests")}
        >
          Sent Requests
        </div>
      </div>

      {/* content */}
      {/* Groups tab */}
      {
        activeTab == "groups" && (
          <div className='w-full flex-1 px-2 flex flex-col overflow-y-scroll'> 
            <button onClick={() => setIsModalActive(true)}
              className='flex items-center justify-center gap-2 p-2 w-fit self-end border-b-2 mb-2 cursor-pointer border-transparent hover:text-secondary hover:border-secondary
            '>
              <Plus className='size-6' />
              Create New Group
            </button>
            <div className={`flex-col px-2 ${view == "admin" ? 'hidden' : 'flex'}`}>
            <div className='flex items-center justify-between w-full'>
                  <span className='text-lg font-outfit font-semibold' >Groups I'm member of</span>
                  <button className='px-1 text-sm cursor-pointer text-secondary hover:underline' 
                    onClick={() => {
                    view == "both" ? setView("member") : setView("both");
                    }}
                  >
                    { view == "both" ? 'View More' : 'View Less' }
                  </button>
                </div>
            </div>

            <div className={`flex-col px-2 ${view == "member" ? 'hidden' : 'flex'}`}>
            <div className='flex items-center justify-between w-full'>
                  <span className='text-lg font-outfit font-semibold' >Groups I'm admin of</span>
                  <button className='px-1 text-sm cursor-pointer text-secondary hover:underline' 
                    onClick={() => {
                    view == "both" ? setView("admin") : setView("both");
                    }}
                  >
                    { view == "both" ? 'View More' : 'View Less' }
                  </button>
                </div>
            </div>
          </div>
        )
      }
      {
        activeTab == "requests" && (
          <div className='bg-secondary w-full flex-1 px-2 overflow-y-scroll'> requests</div>
        )
      }
    </div>
  )
}

const Main = () => {
  return <div>Main</div>
}

function GroupsPage() {
  const [activeTab, setActiveTab] = useState("groups");
  const [view, setView] = useState("both");

  const [isModalActive, setIsModalActive] = useState(false); 

  return (
    <>
      <ResponsiveLayout 
        aside={
          <Aside 
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            view={view}
            setView={setView}
            setIsModalActive={setIsModalActive}
          />
        }

        main={
          <Main />
        }
      />
      {isModalActive && <CreateGroupModal onClose={() => setIsModalActive(false)} />}
    </>
  )
}

export default GroupsPage