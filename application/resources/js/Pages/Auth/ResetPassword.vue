<script setup>
import {useForm} from '@inertiajs/vue3';
import GuestLayout from "@/Layouts/GuestLayout.vue";

const props = defineProps({
    email: String,
    token: String,
});

const form = useForm({
    token: props.token,
    email: props.email,
    password: '',
    password_confirmation: '',
});

const submit = () => {
    form.post(route('password.update'), {
        onFinish: () => form.reset('password', 'password_confirmation'),
    });
};
</script>

<template>
    <GuestLayout title="Reset Password">
        <v-container
            class="fill-height d-flex flex-column justify-center align-center text-center">
            <v-card width="512" elevation="1" class="px-8">
                <v-card-text>
                    <div class="text-h4 text-primary font-weight-black">
                        Secure Area
                    </div>
                    <div class="text-left text-body-2 mb-4">
                        This is a secure area of the application. Please confirm
                        your password before continuing.
                    </div>
                </v-card-text>
                <v-card-text class="mb-4">
                    <v-form @submit.prevent="submit">
                        <v-text-field id="email" v-model="form.email"
                                      type="email" required autofocus
                                      autocomplete="username"
                                      label="Email..."
                                      prepend-icon="mdi-email-outline"/>
                        <v-text-field id="password" v-model="form.password"
                                      type="password" required
                                      autocomplete="new-password"
                                      prepend-icon="mdi-lock-outline"
                                      label="Password..."/>
                        <v-text-field id="password_confirmation"
                                      v-model="form.password_confirmation"
                                      type="password" required
                                      autocomplete="new-password"
                                      prepend-icon="mdi-lock-outline"
                                      label="Confirm password..."/>
                        <v-btn type="submit" color="black" variant="flat"
                               size="large" block :disabled="form.processing"
                               :loading="form.processing">
                            Reset Password
                        </v-btn>
                    </v-form>
                </v-card-text>
            </v-card>
        </v-container>
    </GuestLayout>
</template>
