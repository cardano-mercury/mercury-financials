<script setup>
import { ref } from 'vue';
import { useForm } from '@inertiajs/vue3';
import ActionMessage from '@/Components/ActionMessage.vue';
import FormSection from '@/Components/FormSection.vue';
import InputError from '@/Components/InputError.vue';
import InputLabel from '@/Components/InputLabel.vue';
import PrimaryButton from '@/Components/PrimaryButton.vue';
import TextInput from '@/Components/TextInput.vue';

const passwordInput = ref(null);
const currentPasswordInput = ref(null);

const form = useForm({
    current_password: '',
    password: '',
    password_confirmation: '',
});

const updatePassword = () => {
    form.put(route('user-password.update'), {
        errorBag: 'updatePassword',
        preserveScroll: true,
        onSuccess: () => form.reset(),
        onError: () => {
            if (form.errors.password) {
                form.reset('password', 'password_confirmation');
                passwordInput.value.focus();
            }

            if (form.errors.current_password) {
                form.reset('current_password');
                currentPasswordInput.value.focus();
            }
        },
    });
};
</script>

<template>
    <FormSection @submitted="updatePassword">
        <template #title>
            Update Password
        </template>

        <template #description>
            Ensure your account is using a long, random password to stay secure.
        </template>

        <template #form>
            <v-row>
                <v-col cols="6" sm="4">
                    <v-text-field type="password" label="Current Password" autocomplete="current-password" />
                </v-col>
                <v-col cols="6" sm="4">
                    <v-text-field type="password" label="New Password" autocomplete="new-password" />
                </v-col>
                <v-col cols="6" sm="4">
                    <v-text-field type="password" label="Confirm Password" autocomplete="new-password" />
                </v-col>
            </v-row>
        </template>

        <template #actions>
            <v-chip size="x-large" color="success" append-icon="mdi-check" class="me-4" variant="flat" v-show="form.recentlySuccessful">Saved.</v-chip>
            <v-btn color="primary" :loading="form.processing" @click="updatePassword">
                Save
            </v-btn>
        </template>
    </FormSection>
</template>
