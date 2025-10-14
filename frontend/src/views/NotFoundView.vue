<template>
  <div class="text-center py-12">
    <h1 class="text-6xl font-bold text-gray-300 dark:text-gray-200 mb-4">404</h1>
    <h2 class="text-2xl font-semibold text-gray-900 dark:text-gray-200 mb-2">Page Not Found</h2>
    <p class="text-gray-600 dark:text-gray-200 mb-8">The page you're looking for doesn't exist.</p>
    <RouterLink to="/" class="btn btn-primary">
      {{ $t('common.goHome') }}
    </RouterLink>
  </div>
</template>
