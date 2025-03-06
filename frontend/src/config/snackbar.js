import { createStandaloneToast } from '@chakra-ui/toast';

const { toast } = createStandaloneToast();

export const enqueueSnackbar = (message, { variant = 'info' } = {}) => {
    const status = variant === 'error' ? 'error' : 
                  variant === 'warning' ? 'warning' :
                  variant === 'success' ? 'success' : 'info';
                  
    toast({
        title: message,
        status: status,
        duration: 3000,
        isClosable: true,
        position: 'top-right'
    });
};
