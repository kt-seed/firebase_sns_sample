<script setup>
import Header from '@/components/common/Header.vue';
import PostForm from '@/components/posts/PostForm.vue';
import Timeline from '@/components/posts/Timeline.vue';
</script>

<template>
  <div class="min-h-screen bg-slate-100">
    <Header />

    <main class="container mx-auto max-w-4xl px-4 py-8">
      <section class="space-y-6">
        <PostForm />
        <Timeline />
      </section>
    </main>
  </div>
</template>
