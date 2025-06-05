<script setup>
import {ref} from 'vue';
import {useForm} from '@inertiajs/vue3';
import GuestLayout from "@/Layouts/GuestLayout.vue";

const form = useForm({
    password: '',
});

const passwordInput = ref(null);

const submit = () => {
    form.post(route('password.confirm'), {
        onFinish: () => {
            form.reset();

            passwordInput.value.focus();
        },
    });
};
</script>

<template>
    <GuestLayout title="Secure Area">
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
                        <v-text-field id="password" v-model="form.password"
                                      ref="passwordInput"
                                      type="password" required
                                      autocomplete="current-password"
                                      prepend-icon="mdi-lock-outline"
                                      label="Type your password..."/>
                        <v-btn type="submit" color="black" variant="flat"
                               size="large" block>
                            Confirm
                        </v-btn>
                    </v-form>
                </v-card-text>
            </v-card>
        </v-container>
    </GuestLayout>
</template>
