<script setup>
import {ref, reactive, nextTick} from 'vue';
import DialogModal from './DialogModal.vue';
import InputError from './InputError.vue';
import PrimaryButton from './PrimaryButton.vue';
import SecondaryButton from './SecondaryButton.vue';
import TextInput from './TextInput.vue';

const emit = defineEmits(['confirmed']);

defineProps({
    title: {
        type: String,
        default: 'Confirm Password',
    },
    content: {
        type: String,
        default: 'For your security, please confirm your password to continue.',
    },
    button: {
        type: String,
        default: 'Confirm',
    },
});

const confirmingPassword = ref(false);

const form = reactive({
    password: '',
    error: '',
    processing: false,
});

const passwordInput = ref(null);

const startConfirmingPassword = () => {
    axios.get(route('password.confirmation')).then(response => {
        if (response.data.confirmed) {
            emit('confirmed');
        } else {
            confirmingPassword.value = true;

            setTimeout(() => passwordInput.value.focus(), 250);
        }
    });
};

const confirmPassword = () => {
    form.processing = true;

    axios.post(route('password.confirm'), {
        password: form.password,
    }).then(() => {
        form.processing = false;

        closeModal();
        nextTick().then(() => emit('confirmed'));

    }).catch(error => {
        form.processing = false;
        form.error = error.response.data.errors.password[0];
        passwordInput.value.focus();
    });
};

const closeModal = () => {
    confirmingPassword.value = false;
    form.password = '';
    form.error = '';
};
</script>

<template>
    <span>
        <span @click="startConfirmingPassword">
            <slot/>
        </span>

        <v-dialog v-model="confirmingPassword" width="auto">
            <v-card>
                <v-card-title>{{ title }}</v-card-title>
                <v-card-text>{{ content }}</v-card-text>
                <v-card-text>
                    <v-text-field type="password" v-model="form.password"
                                  placeholder="Password"
                                  autocomplete="current-password"
                                  @keyup.enter="confirmPassword"/>
                    <v-alert type="error" v-if="form.error"
                             class="mt-2">{{ form.error }}</v-alert>
                </v-card-text>
                <v-card-actions>
                    <v-btn color="secondary" @click="closeModal" class="me-2">Cancel</v-btn>
                    <v-btn color="primary" @click="confirmPassword"
                           :loading="form.processing">
                    {{ button }}
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </span>
</template>
