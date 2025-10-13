import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

type EmitFn = (e: 'update:modelValue', value: string) => void

interface UseTaskStatusDropdownProps {
  modelValue: string
}

export function useTaskStatusDropdown(props: UseTaskStatusDropdownProps, emit: EmitFn) {
  const isOpen = ref(false)
  const dropdownContainer = ref<HTMLElement>()
  const dropdownStyle = ref({})

  const options = [
    { value: 'all', label: 'All' },
    { value: 'incomplete', label: 'Incomplete' },
    { value: 'complete', label: 'Complete' }
  ]

  const selectedOption = computed(() => {
    return options.find(option => option.value === props.modelValue) || options[0]
  })

  const updateDropdownPosition = () => {
    if (!dropdownContainer.value) return
    
    const rect = dropdownContainer.value.getBoundingClientRect()
    dropdownStyle.value = {
      top: `${rect.bottom + 4}px`,
      left: `${rect.right - 120}px`, // Align to right edge, assuming min-width of 120px
    }
  }

  const toggleDropdown = async () => {
    isOpen.value = !isOpen.value
    if (isOpen.value) {
      await nextTick()
      updateDropdownPosition()
    }
  }

  const selectOption = (option: typeof options[0]) => {
    emit('update:modelValue', option.value)
    isOpen.value = false
  }

  const closeDropdown = (event: MouseEvent) => {
    const target = event.target as HTMLElement
    if (!dropdownContainer.value?.contains(target)) {
      isOpen.value = false
    }
  }

  onMounted(() => {
    document.addEventListener('click', closeDropdown)
    window.addEventListener('scroll', updateDropdownPosition)
    window.addEventListener('resize', updateDropdownPosition)
  })

  onUnmounted(() => {
    document.removeEventListener('click', closeDropdown)
    window.removeEventListener('scroll', updateDropdownPosition)
    window.removeEventListener('resize', updateDropdownPosition)
  })

  return {
    isOpen,
    dropdownContainer,
    dropdownStyle,
    options,
    selectedOption,
    toggleDropdown,
    selectOption
  }
}

