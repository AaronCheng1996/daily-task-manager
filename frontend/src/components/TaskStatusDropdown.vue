<template>
  <div class="relative z-50" ref="dropdownContainer">
    <button
      @click="toggleDropdown"
      class="flex items-center px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 transform hover:scale-105 border border-gray-200 hover:bg-white/80 text-gray-600 hover:text-gray-800 min-w-[120px] justify-between"
      :class="{ 'dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700 dark:hover:border-slate-500': isOpen }"
    >
      <span>{{ selectedOption.label }}</span>
      <svg 
        class="w-4 h-4 ml-2 transition-transform duration-200"
        :class="{ 'rotate-180': isOpen }"
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>
    
    <Teleport to="body">
      <div
        v-if="isOpen"
        :style="dropdownStyle"
        class="fixed bg-white border border-gray-200 rounded-xl shadow-lg z-[9999] overflow-hidden min-w-[120px]"
        :class="{ 'dark:bg-slate-800 dark:border-slate-700': isOpen }"
      >
        <button
          v-for="option in options"
          :key="option.value"
          @click="selectOption(option)"
          class="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors duration-150 text-sm"
          :class="{ 'bg-primary-50 text-primary-700 font-medium': modelValue === option.value, 'dark:bg-slate-800 dark:text-slate-300': isOpen }"
        >
          {{ option.label }}
        </button>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

interface Props {
  modelValue: string
}

type Emits = (e: 'update:modelValue', value: string) => void

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

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
</script>
