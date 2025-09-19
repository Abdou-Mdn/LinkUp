import React from 'react'

import { useLayoutStore } from '../../store/layout.store'

/* 
 * GroupPreview component
 * Preview for sidebar groups in discover & groups pages.

 * - Displays group infos: image, name.
 * - Displays members count as additional infos.
 
 * 

 * params:
 * - group: object infos to display
 * - isSelected: boolean to check if this group is open in main group container or not
 * - onSelect: callback function to select a group to display on group container 
 */
const GroupPreview = ({group, isSelected, onSelect = () => {}}) => {
  const { isMobile } = useLayoutStore();
  
  // get members count
  const count = group.members.length;
  const additionalInfo = `${count} ${count == 1 ? 'member' : 'members'}`;
  
  return (
    <div
      title={group.name} 
      onClick={() => onSelect(group.groupID)} 
      className={`w-full flex items-center gap-3 p-1 cursor-pointer mt-1 ${!isMobile && isSelected && 'bg-light-300 dark:bg-dark-300'} hover:bg-light-100 dark:hover:bg-dark-100 text-light-txt dark:text-dark-txt`}
    >
      {/* image */}
      <img src={group.image ? group.image : '/assets/group-avatar.svg'} className='size-12 rounded-full'/>
      <div>
          {/* name */}
          <p className='font-semibold truncate'>{group.name}</p>
          {/* members count */}
          <p className='text-xs truncate text-light-txt2 dark:text-dark-txt2'>{additionalInfo}</p>
      </div>
    </div>
  )
}

export default GroupPreview