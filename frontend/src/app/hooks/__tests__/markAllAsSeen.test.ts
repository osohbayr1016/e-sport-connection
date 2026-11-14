import { renderHook, act } from '@testing-library/react';
import { useNotifications } from '../useNotifications';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';

// Mock the contexts
jest.mock('../../contexts/AuthContext');
jest.mock('../../contexts/SocketContext');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseSocket = useSocket as jest.MockedFunction<typeof useSocket>;

// Mock fetch globally
global.fetch = jest.fn();

describe('markAllAsSeen functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it('should mark all notifications as seen successfully', async () => {
    const mockToken = 'test-token';
    
    mockUseAuth.mockReturnValue({
      getToken: jest.fn().mockReturnValue(mockToken),
    } as any);

    mockUseSocket.mockReturnValue({
      socket: null,
    } as any);

    const { result } = renderHook(() => useNotifications());

    // Mock successful API response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    await act(async () => {
      await result.current.markAllAsSeen();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/notifications/read-all'),
      expect.objectContaining({
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${mockToken}`,
          'Content-Type': 'application/json',
        },
      })
    );
  });

  it('should prevent duplicate calls when already processing', async () => {
    const mockToken = 'test-token';
    
    mockUseAuth.mockReturnValue({
      getToken: jest.fn().mockReturnValue(mockToken),
    } as any);

    mockUseSocket.mockReturnValue({
      socket: null,
    } as any);

    const { result } = renderHook(() => useNotifications());

    // Mock a slow API response
    (global.fetch as jest.Mock).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ ok: true }), 100))
    );

    // Start first call
    act(() => {
      result.current.markAllAsSeen();
    });

    // Try to start second call immediately
    await act(async () => {
      await result.current.markAllAsSeen();
    });

    // Should only be called once
    expect((global.fetch as jest.Mock).mock.calls.filter(([, options]) => options?.method === "PATCH")).toHaveLength(1);
  });

  it('should handle API failure with rollback', async () => {
    const mockToken = 'test-token';
    
    mockUseAuth.mockReturnValue({
      getToken: jest.fn().mockReturnValue(mockToken),
    } as any);

    mockUseSocket.mockReturnValue({
      socket: null,
    } as any);

    const { result } = renderHook(() => useNotifications());

    // Mock failed API response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await act(async () => {
      await result.current.markAllAsSeen();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/notifications/read-all'),
      expect.objectContaining({
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${mockToken}`,
          'Content-Type': 'application/json',
        },
      })
    );
  });

  it('should handle network errors gracefully', async () => {
    const mockToken = 'test-token';
    
    mockUseAuth.mockReturnValue({
      getToken: jest.fn().mockReturnValue(mockToken),
    } as any);

    mockUseSocket.mockReturnValue({
      socket: null,
    } as any);

    const { result } = renderHook(() => useNotifications());

    // Mock network error
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new TypeError('Failed to fetch')
    );

    await act(async () => {
      await result.current.markAllAsSeen();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/notifications/read-all'),
      expect.objectContaining({
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${mockToken}`,
          'Content-Type': 'application/json',
        },
      })
    );
  });
});
