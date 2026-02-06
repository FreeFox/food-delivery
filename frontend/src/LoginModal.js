import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  Input,
  VStack,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useToast
} from '@chakra-ui/react';
import auth from './auth';

export default function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleRegister = async () => {
    if (!email || !password) {
      toast({ title: 'Email and password required', status: 'warning', duration: 2000 });
      return;
    }
    try {
      setLoading(true);
      const user = await auth.register(email, password);
      toast({ title: 'Registration successful', status: 'success', duration: 2000 });
      setEmail('');
      setPassword('');
      onLoginSuccess(user);
    } catch (error) {
      console.error(error);
      toast({ title: error.response?.data?.error || 'Registration failed', status: 'error', duration: 2000 });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      toast({ title: 'Email and password required', status: 'warning', duration: 2000 });
      return;
    }
    try {
      setLoading(true);
      const user = await auth.login(email, password);
      toast({ title: 'Login successful', status: 'success', duration: 2000 });
      setEmail('');
      setPassword('');
      onLoginSuccess(user);
    } catch (error) {
      console.error(error);
      toast({ title: error.response?.data?.error || 'Login failed', status: 'error', duration: 2000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Account</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Tabs>
            <TabList>
              <Tab>Login</Tab>
              <Tab>Register</Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                <VStack spacing={4}>
                  <Input
                    placeholder="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <Input
                    placeholder="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Button
                    w="100%"
                    colorScheme="red"
                    isLoading={loading}
                    onClick={handleLogin}
                  >
                    Login
                  </Button>
                </VStack>
              </TabPanel>
              <TabPanel>
                <VStack spacing={4}>
                  <Input
                    placeholder="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <Input
                    placeholder="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Button
                    w="100%"
                    colorScheme="green"
                    isLoading={loading}
                    onClick={handleRegister}
                  >
                    Register
                  </Button>
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
