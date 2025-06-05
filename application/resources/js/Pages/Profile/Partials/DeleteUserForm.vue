<script setup>
import {ref} from 'vue';
import {useForm} from '@inertiajs/vue3';
import ActionSection from '@/Components/ActionSection.vue';

const confirmingUserDeletion = ref(false);
const passwordInput = ref(null);

const form = useForm({
    password: '',
});

const confirmUserDeletion = () => {
    confirmingUserDeletion.value = true;

    setTimeout(() => passwordInput.value.focus(), 250);
};

const deleteUser = () => {
    form.delete(route('current-user.destroy'), {
        preserveScroll: true,
        onSuccess: () => closeModal(),
        onError: () => passwordInput.value.focus(),
        onFinish: () => form.reset(),
    });
};

const closeModal = () => {
    confirmingUserDeletion.value = false;

    form.reset();
};
</script>

<template>
    <ActionSection>
        <template #title>
            Delete Account
        </template>

        <template #description>
            Permanently delete your account.
        </template>

        <template #content>
            <p>
                Once your account is deleted, all of its resources and data will
                be permanently deleted. Before deleting your account, please
                download any data or information that you wish to retain.
            </p>

            <div class="mt-5">
                <v-btn color="error" @click="confirmUserDeletion">
                    Delete Account
                </v-btn>
            </div>

            <v-dialog v-model="confirmingUserDeletion" width="512">
                <v-card>
                    <v-card-title>Delete Account</v-card-title>
                    <v-card-text>
                        Are you sure you want to delete your account? Once your
                        account is deleted, all of its resources and data will
                        be permanently deleted. Please enter your password to
                        confirm you would like to permanently delete your
                        account.
                    </v-card-text>
                    <v-card-text>
                        <v-text-field type="password" v-model="form.password"
                                      placeholder="Password"
                                      autocomplete="current-password"
                                      @keyup.enter="deleteUser"/>
                        <v-alert type="error" class="mt-2"
                                 v-if="form.errors.password">
                            {{ form.errors.password }}
                        </v-alert>
                    </v-card-text>
                    <v-card-actions>
                        <v-btn color="secondary" @click="closeModal"
                               class="me-2">Cancel
                        </v-btn>
                        <v-btn color="error" @click="deleteUser"
                               :loading="form.processing">Delete Account
                        </v-btn>
                    </v-card-actions>
                </v-card>
            </v-dialog>
        </template>
    </ActionSection>
</template>
